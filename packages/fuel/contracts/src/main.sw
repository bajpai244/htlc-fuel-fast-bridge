contract;

use std::address::{Address};
use std::asset_id::{AssetId};
use std::bytes::{Bytes};
use std::bytes_conversions::*;
use std::hash::Hasher;

pub struct Lock {
    token: AssetId,
    destination: Address,
    sender: Address,
    hash: b256,
    balance: u64,
    expiryTimeSeconds: u64,
    fee: u64
}

// TODO: explore if `ref mut self` can save gas
impl Lock {
    fn to_bytes (self) -> Bytes{
        let bytes = Bytes::new();

        bytes
    }

    pub fn compute_hash(self) -> b256 {
        let mut hasher = Hasher::new();

        hasher.write(self.to_bytes());
        hasher.sha256()
    }
} 

abi HTLC {
    fn time_lock () -> bool;
    fn compute_lock_hash(lock: Lock) -> b256;
}

impl HTLC for Contract {
    fn time_lock()  -> bool  {


        true
    }

    fn compute_lock_hash(lock: Lock) -> b256 {
        lock.compute_hash()
    }
}
