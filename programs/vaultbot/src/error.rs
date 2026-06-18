use anchor_lang::prelude::*;

#[error_code]
pub enum VaultbotError {
    #[msg("Invalid Account")] // 6000
    InvalidAccount,
    
    #[msg("Invalid Amount")]  // 6001
    InvalidAmount,

    #[msg("Unauthorized")]    // 6002
    Unauthorized,
}
