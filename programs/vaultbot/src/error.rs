use anchor_lang::prelude::*;

#[error_code]
pub enum VaultbotError {
    #[msg("Invalid Account")] // 6000
    InvalidAccount,
}
