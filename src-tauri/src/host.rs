use serde::Serialize;

#[derive(Serialize)]
pub struct HostSample {
    cpu_ticks: [u64; 4],
    gpu_percent: Option<f64>,
    memory_working_gib: f64,
    disks: Option<Vec<DiskSample>>,
}

#[derive(Serialize)]
pub struct DiskSample {
    id: String,
    name: String,
    bsd_name: String,
    // Decimal strings preserve u64 counters across the JavaScript bridge.
    read_bytes: String,
    write_bytes: String,
}

#[cfg(target_os = "macos")]
fn disk_samples(output: &[u8]) -> Option<Vec<DiskSample>> {
    let tree = plist::Value::from_reader_xml(output).ok()?;
    let mut disks = Vec::new();
    for driver in tree.as_array()? {
        let Some(driver) = driver.as_dictionary() else {
            continue;
        };
        let Some(id) = driver
            .get("IORegistryEntryID")
            .and_then(plist::Value::as_unsigned_integer)
        else {
            continue;
        };
        let Some(stats) = driver
            .get("Statistics")
            .and_then(plist::Value::as_dictionary)
        else {
            continue;
        };
        let Some(read) = stats
            .get("Bytes (Read)")
            .and_then(plist::Value::as_unsigned_integer)
        else {
            continue;
        };
        let Some(write) = stats
            .get("Bytes (Write)")
            .and_then(plist::Value::as_unsigned_integer)
        else {
            continue;
        };
        let Some(children) = driver
            .get("IORegistryEntryChildren")
            .and_then(plist::Value::as_array)
        else {
            continue;
        };
        for media in children {
            let Some(media) = media.as_dictionary() else {
                continue;
            };
            if media.get("Whole").and_then(plist::Value::as_boolean) != Some(true) {
                continue;
            }
            let Some(bsd) = media.get("BSD Name").and_then(plist::Value::as_string) else {
                continue;
            };
            let name = media
                .get("IORegistryEntryName")
                .and_then(plist::Value::as_string)
                .unwrap_or(bsd);
            disks.push(DiskSample {
                id: id.to_string(),
                name: name.trim_end_matches(" Media").to_owned(),
                bsd_name: bsd.to_owned(),
                read_bytes: read.to_string(),
                write_bytes: write.to_string(),
            });
            break;
        }
    }
    disks.sort_by(|a, b| a.bsd_name.cmp(&b.bsd_name));
    Some(disks)
}

#[cfg(target_os = "macos")]
fn gpu_utilization(output: &str) -> Option<f64> {
    let statistics = output
        .lines()
        .find(|line| line.contains("\"PerformanceStatistics\" ="))?;
    let value = statistics.split("\"Device Utilization %\"=").nth(1)?;
    let digits: String = value.chars().take_while(char::is_ascii_digit).collect();
    let percent = digits.parse::<f64>().ok()?;
    (0.0..=100.0).contains(&percent).then_some(percent)
}

#[tauri::command]
#[allow(deprecated)] // libc marks mach_host_self deprecated; this is the system Mach host port.
pub fn host_sample() -> Result<HostSample, String> {
    #[cfg(target_os = "macos")]
    {
        use std::{mem::MaybeUninit, process::Command};

        let host = unsafe { libc::mach_host_self() };
        let mut cpu = MaybeUninit::<libc::host_cpu_load_info>::zeroed();
        let mut cpu_count = libc::HOST_CPU_LOAD_INFO_COUNT;
        // SAFETY: buffers match the requested Mach structures and counts.
        let cpu_result = unsafe {
            libc::host_statistics(
                host,
                libc::HOST_CPU_LOAD_INFO,
                cpu.as_mut_ptr().cast(),
                &mut cpu_count,
            )
        };
        if cpu_result != libc::KERN_SUCCESS || cpu_count < libc::HOST_CPU_LOAD_INFO_COUNT {
            return Err(format!(
                "Could not sample CPU load: Mach error {cpu_result}"
            ));
        }
        let cpu = unsafe { cpu.assume_init() };

        let mut memory = MaybeUninit::<libc::vm_statistics64>::zeroed();
        let mut memory_count = libc::HOST_VM_INFO64_COUNT;
        let memory_result = unsafe {
            libc::host_statistics64(
                host,
                libc::HOST_VM_INFO64,
                memory.as_mut_ptr().cast(),
                &mut memory_count,
            )
        };
        // Older macOS versions return fewer fields than the current libc struct.
        // The working-set calculation only needs fields through compressor_page_count.
        let required_memory_count =
            (std::mem::offset_of!(libc::vm_statistics64, compressor_page_count)
                + std::mem::size_of::<libc::natural_t>())
                / std::mem::size_of::<libc::integer_t>();
        if memory_result != libc::KERN_SUCCESS || memory_count < required_memory_count as u32 {
            return Err(format!(
                "Could not sample unified memory: Mach error {memory_result}, fields {memory_count}"
            ));
        }
        let memory = unsafe { memory.assume_init() };
        let page_bytes = unsafe { libc::sysconf(libc::_SC_PAGESIZE) };
        if page_bytes <= 0 {
            return Err("Could not read virtual memory page size.".to_owned());
        }
        let page_gib = page_bytes as f64 / 1024_f64.powi(3);
        let memory_working_gib = (memory.active_count as f64
            + memory.wire_count as f64
            + memory.compressor_page_count as f64)
            * page_gib;

        let gpu_percent = Command::new("/usr/sbin/ioreg")
            .args(["-r", "-c", "IOAccelerator", "-d", "1", "-l", "-w0"])
            .output()
            .ok()
            .filter(|output| output.status.success())
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .and_then(|output| gpu_utilization(&output));

        let disks = Command::new("/usr/sbin/ioreg")
            .args(["-a", "-l", "-r", "-c", "IOBlockStorageDriver", "-d", "2"])
            .output()
            .ok()
            .filter(|output| output.status.success())
            .and_then(|output| disk_samples(&output.stdout));

        Ok(HostSample {
            cpu_ticks: cpu.cpu_ticks.map(u64::from),
            gpu_percent,
            memory_working_gib,
            disks,
        })
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Host telemetry requires macOS.".to_owned())
    }
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::{disk_samples, gpu_utilization, host_sample};

    #[test]
    fn reads_only_device_utilization_from_gpu_statistics() {
        let sample = r#""PerformanceStatistics" = {"Renderer Utilization %"=18,"Device Utilization %"=63,"Tiler Utilization %"=11}"#;
        assert_eq!(gpu_utilization(sample), Some(63.0));
        assert_eq!(gpu_utilization("no GPU statistics"), None);
        assert_eq!(
            gpu_utilization(r#""PerformanceStatistics" = {"Device Utilization %"=104}"#),
            None
        );
    }

    #[test]
    fn parses_whole_drive_counters_and_skips_partitions_or_incomplete_entries() {
        let xml = br#"<?xml version="1.0"?><plist version="1.0"><array><dict>
        <key>IORegistryEntryID</key><integer>7</integer><key>Statistics</key><dict>
        <key>Bytes (Read)</key><integer>9007199254740993</integer><key>Bytes (Write)</key><integer>0</integer></dict>
        <key>IORegistryEntryChildren</key><array>
        <dict><key>Whole</key><false/><key>BSD Name</key><string>disk0s1</string></dict>
        <dict><key>Whole</key><true/><key>BSD Name</key><string>disk0</string><key>IORegistryEntryName</key><string>SSD Media</string></dict>
        </array></dict><dict><key>IORegistryEntryID</key><integer>8</integer></dict></array></plist>"#;
        let disks = disk_samples(xml).unwrap();
        assert_eq!(disks.len(), 1);
        assert_eq!(disks[0].id, "7");
        assert_eq!(disks[0].name, "SSD");
        assert_eq!(disks[0].bsd_name, "disk0");
        assert_eq!(disks[0].read_bytes, "9007199254740993");
        assert_eq!(disks[0].write_bytes, "0");
        assert!(disk_samples(b"not a plist").is_none());
        assert!(disk_samples(br#"<plist version="1.0"><array/></plist>"#)
            .unwrap()
            .is_empty());
    }

    #[test]
    fn samples_real_mach_counters() {
        let sample = host_sample().expect("host counters should be readable");
        assert!(sample.cpu_ticks.iter().any(|tick| *tick > 0));
        assert!(sample.memory_working_gib > 0.0);
        assert!(sample
            .gpu_percent
            .map_or(true, |value| (0.0..=100.0).contains(&value)));
    }
}
