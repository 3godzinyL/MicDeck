use serde::{Deserialize,Serialize};
use thiserror::Error;
#[derive(Debug,Clone,Copy,Serialize,Deserialize)]
#[serde(rename_all="camelCase")]
pub enum DriverState{NotInstalled,Installing,EndpointsStarting,Ready,UpdateRequired,
                     RepairRequired,RestartRequired,Error}
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all="camelCase")]
pub struct DriverStatus{pub state:DriverState,pub reboot_required:bool,pub win32_error:u32}
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all="camelCase")]
pub struct DriverHelperResult{pub ok:bool,pub win32_error:u32,pub reboot_required:bool,
 pub device_present:bool,pub package_present:bool}
#[derive(Debug,Error)]
pub enum DriverError{
 #[error("driver helper missing")]HelperMissing,
 #[error("driver package incomplete: {0}")]PackageIncomplete(String),
 #[error("driver package hash mismatch: {0}")]HashMismatch(String),
 #[error("helper start failed: {0}")]HelperStart(String),
 #[error("invalid helper response: {0}")]InvalidResponse(String),
 #[error("driver operation failed with Win32 error {0}")]Win32(u32),
 #[error("operation is supported only on Windows")]Unsupported,
}
