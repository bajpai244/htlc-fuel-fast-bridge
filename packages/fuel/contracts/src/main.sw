contract;

use std::address::Address;
use std::asset_id::AssetId;
use std::bytes::Bytes;
use std::bytes_conversions::{b256::*, u64::*};
use std::hash::Hasher;

pub struct Lock {
    token: AssetId,
    destination: Address,
    sender: Address,
    hash: b256,
    balance: u64,
    expiryTimeSeconds: u64,
    fee: u64,
}

// TODO: needs testing as well
// TODO: explore if `ref mut self` can save gas
impl Lock {
    fn to_bytes(self) -> Bytes {
        let mut bytes = Bytes::new();

        let mut token_bytes = self.token.bits().to_be_bytes();
        let mut destination_bytes = self.destination.bits().to_be_bytes();
        let mut sender_bytes = self.sender.bits().to_be_bytes();
        let mut hash_bytes = self.hash.to_be_bytes();
        let balance_bytes = self.balance.to_be_bytes();
        let expiry_time_seconds_bytes = self.expiryTimeSeconds.to_be_bytes();
        let fee_bytes = self.fee.to_be_bytes();

        bytes.append(token_bytes);
        bytes.append(destination_bytes);
        bytes.append(sender_bytes);
        bytes.append(hash_bytes);
        bytes.append(balance_bytes);
        bytes.append(expiry_time_seconds_bytes);
        bytes.append(fee_bytes);

        bytes
    }
    pub fn compute_hash(self) -> b256 {
        let mut hasher = Hasher::new();
        hasher.write(self.to_bytes());
        hasher.sha256()
    }
}
abi HTLC {
    fn time_lock() -> bool;
    fn compute_lock_hash(lock: Lock) -> b256;
}
impl HTLC for Contract {
    fn time_lock() -> bool {
        true
    }
    fn compute_lock_hash(lock: Lock) -> b256 {
        lock.compute_hash()
    }
}
