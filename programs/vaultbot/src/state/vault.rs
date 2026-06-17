use anchor_lang::prelude::*;
use crate::error::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    /// Owner of the Vault account
    pub owner: Pubkey,
    /// Bump for the Vault PDA seeds
    pub bump: u8,
}

impl Vault {
    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(
            self.owner,
            Pubkey::default(),
            VaultbotError::InvalidAccount,
        );
        
        Ok(())
    }
}