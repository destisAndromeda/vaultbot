use anchor_lang::prelude::*;
use anchor_lang::declare_program;
use anchor_litesvm::{
    AnchorContext,
    AnchorLiteSVM,
    AssertionHelpers,
    Pubkey,
    Signer,
    TestHelpers,
};

declare_program!(vaultbot);

use self::vaultbot::accounts::Vault;
use self::vaultbot::client::{ accounts, args };

pub const PROGRAM_BYTES: &[u8] = include_bytes!("../../../target/deploy/vaultbot.so");

pub fn setup() -> AnchorContext {
    let mut ctx = AnchorLiteSVM::build_with_program(self::vaultbot::ID, PROGRAM_BYTES);

    let clock = Clock {
        slot: 1000,
        epoch_start_timestamp: 0,
        epoch: 1,
        leader_schedule_epoch: 1,
        unix_timestamp: 1000,
    };

    ctx.svm.set_sysvar(&clock);
    ctx
}

pub fn get_vault_pda(owner: Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[
            b"vault",
            owner.as_ref(),
        ],
        &self::vaultbot::ID,
    ).0
}

fn initialize_vault(
    ctx: &mut AnchorContext,
    owner: &anchor_litesvm::Keypair,
) {
    let vault_pda = get_vault_pda(owner.pubkey());

    let ix = ctx
        .program()
        .accounts(accounts::InitializeVault {
            owner: owner.pubkey(),
            vault: vault_pda,
            system_program: system_program::ID,
        })
        .args(args::InitializeVault{})
        .instruction()
        .unwrap();

    let result = ctx.execute_instruction(ix, &[owner]).unwrap();
    result.assert_success();
    ctx.svm.assert_account_exists(&vault_pda);
}

#[test]
fn test_init_vault() {
    let mut ctx = setup();
    let user = ctx.svm.create_funded_account(1_000_000_000).unwrap();
    let vault_pda = get_vault_pda(user.pubkey());

    initialize_vault(
        &mut ctx,
        &user,
    );

    let vault_account: Vault = ctx.get_account(&vault_pda).unwrap();
    assert_eq!(vault_account.owner, user.pubkey());
}

#[test]
fn test_deposit() {
    let mut ctx = setup();
    let owner = ctx.svm.create_funded_account(1_000_000_000).unwrap();
    let vault_pda = get_vault_pda(owner.pubkey());

    initialize_vault(&mut ctx, &owner);
    let amount = Rent::default().minimum_balance(33) + 1_000_000;

    let owner_balance_before = ctx.svm.get_balance(&owner.pubkey()).unwrap();
    let vault_balance_before = ctx.svm.get_balance(&vault_pda).unwrap();

    let ix = ctx
        .program()
        .accounts(accounts::Deposit {
            signer: owner.pubkey(),
            vault: vault_pda,
            system_program: system_program::ID,
        })
        .args(args::Deposit {
            owner: owner.pubkey(),
            amount,
        })
        .instruction()
        .unwrap();

    let result = ctx.execute_instruction(ix, &[&owner]).unwrap();
    result.assert_success();

    let owner_balance_after = ctx.svm.get_balance(&owner.pubkey()).unwrap();
    let vault_balance_after = ctx.svm.get_balance(&vault_pda).unwrap();

    assert!(
        owner_balance_after < owner_balance_before - amount,
    );

    assert!(
        vault_balance_after > vault_balance_before,
    );

    assert!(
        vault_balance_after > Rent::default().minimum_balance(33),
    );

    let vault_account: Vault = ctx.get_account(&vault_pda).unwrap();
    assert_eq!(vault_account.owner, owner.pubkey());
}

#[test]
fn test_withdraw() {
    let mut ctx = setup();
    let owner = ctx.svm.create_funded_account(1_000_000_000).unwrap();
    let vault_pda = get_vault_pda(owner.pubkey());

    initialize_vault(&mut ctx, &owner);
    let amount = Rent::default().minimum_balance(33) + 1_000_000;

    let ix = ctx
        .program()
        .accounts(accounts::Deposit {
            signer: owner.pubkey(),
            vault: vault_pda,
            system_program: system_program::ID,
        })
        .args(args::Deposit {
            owner: owner.pubkey(),
            amount,
        })
        .instruction()
        .unwrap();

    let result = ctx.execute_instruction(ix, &[&owner]).unwrap();
    result.assert_success();

    let owner_balance_before = ctx.svm.get_balance(&owner.pubkey()).unwrap();
    let vault_balance_before = ctx.svm.get_balance(&vault_pda).unwrap();

    let ix = ctx
        .program()
        .accounts(accounts::Withdraw {
            owner: owner.pubkey(),
            vault: vault_pda,
            system_program: system_program::ID,
        })
        .args(args::Withdraw {
            amount,
        })
        .instruction()
        .unwrap();

    let result = ctx.execute_instruction(ix, &[&owner]).unwrap();
    result.assert_success();

    let owner_balance_after = ctx.svm.get_balance(&owner.pubkey()).unwrap();
    let vault_balance_after = ctx.svm.get_balance(&vault_pda).unwrap();

    assert!(
        owner_balance_after > owner_balance_before,
    );

    assert!(
        owner_balance_after <= owner_balance_before + amount,
    );

    assert_eq!(
        vault_balance_before,
        vault_balance_after + amount,
    );
}