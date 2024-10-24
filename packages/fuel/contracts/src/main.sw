contract;

use std::address::{Address};
use std::asset_id::{AssetId};

struct Lock {
    token: AssetId,
    destination: Address,
    sender: Address,
    hash: b256,
    balance: u64,
    expiryTimeSeconds: u64,
    fee: u64
}

abi HTLC {
    fn time_lock () -> bool;
}

impl HTLC for Contract {
    fn time_lock()  -> bool  {




        true
    }
}
