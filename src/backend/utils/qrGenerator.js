const QRCode = require('qrcode');

const generateQRCode = async (data) => {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
        return qrCodeDataURL;
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

const generateQRCodeCanvas = (data, canvasElement) => {
    return new Promise((resolve, reject) => {
        QRCode.toCanvas(canvasElement, JSON.stringify(data), (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

module.exports = {
    generateQRCode,
    generateQRCodeCanvas
};