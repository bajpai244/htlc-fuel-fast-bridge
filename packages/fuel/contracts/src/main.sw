contract;

use std::address::Address;
use std::asset_id::AssetId;
use std::block::height;
use std::bytes::Bytes;
use std::bytes_conversions::{b256::*, u64::*, u32::*};
// Hash is being imported to allow reading from StorageMap
use std::hash::{Hash, Hasher};
use std::logging::log;
use std::call_frames::msg_asset_id;
use std::context::msg_amount;
use std::asset::transfer;
use std::identity::Identity;

// TODO: we need an extra salt to allow for multiple locks to exist for the same amount?
// need to discuss this first, for simplicity avoiding it for now
pub struct Lock {
    token: AssetId,
    destination: Address,
    sender: Address,
    hash: b256,
    balance: u64,
    // expressed in block time
    expiryTimeSeconds: u32,
    fee: u64,
}
storage {
    /// maps lock_hash to wether is has been locked or not
    /// b256 -> 1; mean this lock hash been locked
    /// b256 -> 2; means this lock has been succesfully redeemed
    /// b256 -> 3; means this lock has been expired, and redeemed
    lock_map: StorageMap<b256, u8> = StorageMap {},
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
pub struct LockEvent {
    lock: Lock,
    lock_hash: b256,
}

pub enum LockErrors {
    BalanceUnderflow: (),
    FeeOverflow: (),
    InvalidDestination: (),
    ReleaseTimeUnderflow: (),
    IncorrectAssetId: (),
    InvalidBalance: (),
    LockAlreadyExist: (),
}

pub enum UnlockErrors {
    LockNotExist: (),
    AlreadyUnlocked: (),
    WrongDigest: ()
}

abi HTLC {
    #[storage(read, write)]
    #[payable]
    fn time_lock(lock: Lock) -> bool;
    fn compute_lock_hash(lock: Lock) -> b256;
    #[storage(read, write)]
    fn unlock(lock: Lock, digest: Bytes) -> bool;
}

impl HTLC for Contract {
    #[storage(read, write)]
    #[payable]
    fn time_lock(lock: Lock) -> bool {
        require(lock.balance > 0, LockErrors::BalanceUnderflow);
        require(lock.fee <= lock.balance, LockErrors::FeeOverflow);
        require(
            lock.destination != Address::zero(),
            LockErrors::InvalidDestination,
        );
        require(
            lock.expiryTimeSeconds > height(),
            LockErrors::ReleaseTimeUnderflow,
        );

        let lock_hash = lock.compute_hash();
        let lock_exists = storage.lock_map.get(lock_hash).try_read().is_some();

        require(!lock_exists, LockErrors::LockAlreadyExist);
        storage.lock_map.insert(lock_hash, 1);

        require(msg_asset_id() == lock.token, LockErrors::IncorrectAssetId);
        require(msg_amount() == lock.balance, LockErrors::InvalidBalance);

        log(LockEvent {
            lock,
            lock_hash,
        });

        true
    }

    #[storage(read, write)]
    fn unlock(lock: Lock, digest: Bytes) -> bool {

        let mut hasher = Hasher::new();
        hasher.write(digest);

        let digest_hash = hasher.sha256();
        require(lock.hash == digest_hash, UnlockErrors::WrongDigest);

        let lock_hash = lock.compute_hash();

        let lock_exists = storage.lock_map.get(lock_hash).try_read().is_some();
        require(lock_exists, UnlockErrors::LockNotExist);

        // safe unwrap because of the above require
        let lock_status = storage.lock_map.get(lock_hash).try_read().unwrap();
        require(lock_status == 1, UnlockErrors::AlreadyUnlocked);

        if lock.expiryTimeSeconds  <= height() {
            storage.lock_map.insert(lock_hash, 2); 

            transfer(Identity::Address(lock.destination), lock.token, lock.balance);
        }
        else {
             storage.lock_map.insert(lock_hash, 3);

            transfer(Identity::Address(lock.sender), lock.token, lock.balance - lock.fee);

            //TODO: It looks like doing two transfers are failing, we need to dive deeper into std lib to understand
            // Question: If two variable transfers are required, then do we need two variable outputs for that asset ID in the transaction?
            // transfer(Identity::Address(lock.destination), lock.token, lock.fee);

        };

        true 
    }

    fn compute_lock_hash(lock: Lock) -> b256 {
        lock.compute_hash()
    }
}
