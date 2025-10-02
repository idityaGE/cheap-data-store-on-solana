use anchor_lang::prelude::*;

declare_id!("Eat4KMevMCmwhQmmVaZcVJgfE2Uye9jarAHkctM3171Y");

#[program]
mod idk {
    use super::*;

    pub fn initialize_db(ctx: Context<UserInitialize>, datatype: String) -> Result<()> {
        let db = &mut ctx.accounts.db_account;
        let data_account = &mut ctx.accounts.data_account;

        db.bump = ctx.bumps.db_account;
        db.type_field = datatype;
        db.tail_tx = String::new();
        
        data_account.bump = ctx.bumps.data_account;
        data_account.data = String::new();
        data_account.offset = 0;
        data_account.prev_tx = String::new();

        Ok(())
    }

    pub fn add_chunk(ctx: Context<AddChunk>, new_data: String) -> Result<()> {
        let db = &mut ctx.accounts.db_account;
        let data_account = &mut ctx.accounts.data_account;

        let prev_tail = db.tail_tx.clone();

        data_account.data = new_data.clone();
        data_account.prev_tx = prev_tail;
        data_account.offset += 1;

        msg!(
            "CHUNK_ADDED:{}:{}:{}",
            data_account.offset,
            new_data,
            data_account.prev_tx
        );
        Ok(())
    }

    pub fn update_db_account(ctx: Context<UpdateDBAccount>, tail_tx: String) -> Result<()> {
        let db = &mut ctx.accounts.db_account;
        db.tail_tx = tail_tx;
        Ok(())
    }
}

#[account]
pub struct DBAccount {
    pub bump: u8,
    pub type_field: String,
    pub tail_tx: String,
}

#[account]
pub struct DataAccount {
    pub bump: u8,
    pub data: String,
    pub offset: i64,
    pub prev_tx: String, // first is "Genesis"
}

#[derive(Accounts)]
pub struct UserInitialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        seeds = [b"db_account", user.key().as_ref()],
        bump,
        space = 8 + 8 + 50 + 20 + 100
    )]
    pub db_account: Account<'info, DBAccount>,

    #[account(
        init,
        payer = user,
        seeds = [b"data_account", user.key().as_ref()],
        bump,
        space = 8 + 900 + 100
    )]
    pub data_account: Account<'info, DataAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddChunk<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub data_account: Account<'info, DataAccount>,
    pub db_account: Account<'info, DBAccount>,
}

#[derive(Accounts)]
pub struct UpdateDBAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub db_account: Account<'info, DBAccount>,
}
