// craco.config.js
module.exports = {
    devServer: {
        proxy: {
            "/socket.io": {
                target: "https://sockethandler-a6loowyw7q-uc.a.run.app", // Your actual DigitalOcean function URL
                ws: true,
            },
        },
        allowedHosts: ["localhost", "your-digitalocean-domain.com"], // Include your DigitalOcean domain
    },
};
