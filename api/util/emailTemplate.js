
module.exports = function(userName, link) {
    return (
    `<!DOCTYPE html>
    <html class="no-js" lang="en">
    <head>
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
        <title>Q vote</title>
    </head>
    <body style="margin: 0; padding: 0;">
    <table class="main-body" align="center" cellspacing="0" cellpadding="0" style="max-width: 600px;">
        <tbody>
        <tr>
            <td>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 3px solid #973CF1;">
                    <tbody>
                    <tr>
                        <td style="display: inline-block; padding: 0 10px; width: 100%">
                            <a href="#" target="_blank"
                            style="text-decoration: none; display: flex; text-align: center; margin-top: 15px;">
                                <img src="./image/logo.png" alt="Q vote" style="vertical-align: middle; margin: 0 auto;">
                            </a>
                        </td>
                    </tr>
                    </tbody> 
                </table>
            </td>
        </tr>

        <tr>
            <td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tbody>
                    <tr>
                        <td style="text-align: center;">
                            <p style="font-size: 24px; font-weight: bold; margin: 0; padding: 20px 0; color: #000; font-family: 'Open Sans', sans-serif;">
                                Welcome to Q vote!</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        <tr>
            <td>
                <table width="100%" cellpadding="0" cellspacing="0"
                    style="padding-top: 30px; padding-bottom: 10px;">
                    <tbody>
                    <tr>
                        <td style="text-align: left; padding: 0 20px;">
                            <p style="font-size: 18px; font-weight: 500; margin: 0; color: #000000; font-family: 'Open Sans', sans-serif;">
                                Hello ${userName},</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="text-align: left; padding: 15px 20px;">
                            <p style="font-size: 16px; margin: 0; color: #000000; font-weight: 400; font-family: 'Open Sans', sans-serif;">
                                Thank you for signing up for Q vote.
                            </p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        <tr>
            <td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tbody>
                    <tr>
                        <td style="text-align: center;">
                            <table align="center">
                                <tr>
                                    <td style="padding-top: 30px;">
                                        <Button style="font-size: 26px; font-weight: bold; margin: 0; padding: 10px 30px; color: #000000; font-family: 'Open Sans', sans-serif">
                                            <a href="${link}" >Verify</a>
                                        </Button>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding-bottom: 30px;">
                            <p style="text-align: center; font-family: 'Open Sans', sans-serif; font-size: 16px; color: #000000;">
                                As soon as your email is verified, your account will be activated.
                                Enjoy saving time with Q vote!
                            </p>
                            <p style="font-size: 18px; font-weight: bold; text-align: center; font-family: 'Open Sans', sans-serif;">
                                Thank you for being part of Q vote!</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    `
    )
}