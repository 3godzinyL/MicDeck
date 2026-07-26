use cpal::traits::{DeviceTrait, HostTrait};

fn main() {
    let Some(device) = cpal::default_host().default_input_device() else {
        println!("NONE");
        return;
    };

    let name = device
        .description()
        .map(|description| description.name().to_string())
        .unwrap_or_else(|_| "Unknown device".to_string());
    let raw_id = device
        .id()
        .map(|id| id.1)
        .unwrap_or_else(|_| "UNKNOWN".to_string());
    println!("{name}\n{raw_id}");
}
