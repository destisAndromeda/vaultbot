use anchor_lang::prelude::*;
use crate::error::*;

#[account]
#[derive(InitSpace)]
pub struct SmartWallet {
    /// Key of wallet owner
    pub owner: Pubkey,

    /// One of a few possibale wallet states (Active, Pause, Close)
    pub state: WalletState,

    /// Total amount spent in the current day (in lamports)
    /// Resets automatically when `last_spend_day` changes
    pub spent_today: u64,

    /// Unix timestamp of the start of the current spending day
    /// Used to detect day rollover and reset `spent_today`
    pub last_spend_day: i64,

    /// Struct for rule the wallet
    pub config: WalletConfig,

    /// Date of the wallet was created
    pub created_at: i64,

    /// Bump for SmartWallet PDA seeds
    pub bump: u8,
}

impl SmartWallet {
    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(
            self.owner,
            Pubkey::default(),
            VaultbotError::InvalidAccount,
        );

        Ok(())
    }
}

#[derive(
    AnchorSerialize,
    AnchorDeserialize,
    InitSpace,
    Clone,
)]
pub struct WalletConfig {
    /// Max withdraw per day (lamports)
    pub daily_limit: u64,

    /// Max withdraw per one transaction (lamports)
    pub per_tx_limit: u64,

    /// Authority for transfer without owner sign
    pub delegate: Option<Pubkey>,

    // pub allowed_destinations: Vec<Pubkey>,
}

#[derive(
    AnchorSerialize,
    AnchorDeserialize,
    InitSpace,
    Clone,
)]
pub enum WalletState {
    /// Start of active period
    Active { timestamp: i64 },

    /// Start of pause period
    Pause  { timestamp: i64 },

    /// Start of close period; Can be changed once
    Deactivate  { timestamp: i64 },
}