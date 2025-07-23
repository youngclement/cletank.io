// Kết nối ví Solana (Phantom) và hiển thị địa chỉ ví trên testnet
export async function connectSolanaWallet() {
    if (window.solana && window.solana.isPhantom) {
        try {
            // Yêu cầu kết nối ví
            const resp = await window.solana.connect();
        } catch (err) {
            document.getElementById('wallet-address').innerText = 'Kết nối ví thất bại!';
        }
    } else {
        document.getElementById('wallet-address').innerHTML = 'Vui lòng cài đặt <a href="https://phantom.app/" target="_blank">Phantom Wallet</a>!';
    }
}
