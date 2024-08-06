// craco.config.js
module.exports = {
    devServer: {
        proxy: {
            "/socket.io": {
                target: "https://sockethandler-a6loowyw7q-uc.a.run.app", // Your new function URL
                ws: true,
            },
        },
        allowedHosts: ["localhost", ".web.app"], // Include Firebase hosting domain
    },
};
