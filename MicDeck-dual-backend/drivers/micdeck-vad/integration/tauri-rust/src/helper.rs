use crate::model::{DriverError,DriverHelperResult};
use std::{path::Path,process::Command};
#[derive(Debug,Clone,Copy)]pub enum DriverHelperCommand{Status,Install,Repair,Uninstall}
impl DriverHelperCommand{fn as_str(self)->&'static str{match self{
 Self::Status=>"status",Self::Install=>"install",Self::Repair=>"repair",Self::Uninstall=>"uninstall"}}}
pub fn invoke_helper(helper:&Path,cmd:DriverHelperCommand,package:Option<&Path>)
 ->Result<DriverHelperResult,DriverError>{
 if !helper.is_file(){return Err(DriverError::HelperMissing);}
 #[cfg(not(windows))]{let _=(helper,cmd,package);return Err(DriverError::Unsupported);}
 #[cfg(windows)]{
  let mut p=Command::new(helper);p.arg(cmd.as_str());if let Some(d)=package{p.arg(d);}
  let out=p.output().map_err(|e|DriverError::HelperStart(e.to_string()))?;
  let r:DriverHelperResult=serde_json::from_slice(&out.stdout)
   .map_err(|e|DriverError::InvalidResponse(e.to_string()))?;
  if !out.status.success()||!r.ok{return Err(DriverError::Win32(r.win32_error));}
  Ok(r)
 }}
