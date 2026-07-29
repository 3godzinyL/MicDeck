#![forbid(unsafe_code)]
mod helper;mod model;mod package;mod sha256;
pub use helper::{invoke_helper,DriverHelperCommand};
pub use model::{DriverError,DriverHelperResult,DriverState,DriverStatus};
pub use package::{verify_driver_package,DriverPackageFile,DriverPackageManifest};
use std::path::Path;
pub fn query_driver_status(helper:&Path)->Result<DriverStatus,DriverError>{
 let r=invoke_helper(helper,DriverHelperCommand::Status,None)?;
 let state=if r.device_present&&r.package_present{DriverState::Ready}
  else if r.package_present{DriverState::EndpointsStarting}else{DriverState::NotInstalled};
 Ok(DriverStatus{state,reboot_required:r.reboot_required,win32_error:r.win32_error})
}
