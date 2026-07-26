use crate::{model::DriverError,sha256::digest_hex};
use serde::{Deserialize,Serialize};use std::{fs,path::Path};
#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct DriverPackageManifest{pub version:String,pub abi:u32,pub files:Vec<DriverPackageFile>}
#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct DriverPackageFile{pub name:String,pub sha256:String}
pub fn verify_driver_package(dir:&Path,m:&DriverPackageManifest)->Result<(),DriverError>{
 for file in &m.files{let path=dir.join(&file.name);
  if !path.is_file(){return Err(DriverError::PackageIncomplete(file.name.clone()));}
  let bytes=fs::read(&path).map_err(|_|DriverError::PackageIncomplete(file.name.clone()))?;
  if !digest_hex(&bytes).eq_ignore_ascii_case(&file.sha256){
   return Err(DriverError::HashMismatch(file.name.clone()));}}
 Ok(())
}
