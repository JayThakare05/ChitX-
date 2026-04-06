const axios = require('axios');

class TelegramService {
    constructor() {
        // You'll need to set these in your .env file
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.enabled = !!(this.botToken && this.chatId);
    }

    /**
     * Sends a transaction receipt / payout alert to the Telegram group/user
     * @param {string} poolId - The pool ID
     * @param {string} winnerAddress - The wallet address that received the funds
     * @param {number} payoutAmount - Amount of CTX
     * @param {string} txHash - Transaction Hash
     */
    async sendPayoutReceipt(poolId, winnerAddress, payoutAmount, txHash) {
        if (!this.enabled) {
            console.warn('⚠️ Telegram integration disabled. Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env');
            return false;
        }

        const message = `🔔 *ChitX Autonomous Payout Deployed!* 🔔\n\n` +
                        `🏆 *Pool:* ${poolId.slice(0, 8)}...\n` +
                        `👤 *Winner:* \`${winnerAddress}\`\n` +
                        `💰 *Amount:* ${payoutAmount} CTX\n` +
                        `🔗 *Tx Hash:* [View on Sepolia Explorer](https://sepolia.etherscan.io/tx/${txHash})`;

        try {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            await axios.post(url, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'Markdown'
            });
            console.log('✅ Telegram Notification sent successfully!');
            return true;
        } catch (error) {
            console.error('❌ Failed to send Telegram notification:', error.message);
            return false;
        }
    }
}

module.exports = new TelegramService();
