import {
    httpsCallable,
} from "firebase/functions";

import {
    functions,
} from "./firebase";


// ---------------------------------------------------------
// Firebase Callable Function
// ---------------------------------------------------------

const notifyBid = httpsCallable(
    functions,
    "notifyBid"
);


// ---------------------------------------------------------
// Send Bid Notification
// ---------------------------------------------------------

export async function sendBidNotification(data) {

    try {

        console.log(
            "Calling Firebase notifyBid function..."
        );

        console.log(
            "Notification data:",
            data
        );


        const result = await notifyBid({

            auctionId:
            data.auctionId,

            equipmentName:
            data.equipmentName,

            sellerCompany:
            data.sellerCompany,

            sellerUserId:
            data.sellerUserId,

            sector:
            data.sector,

            bidAmount:
            data.bidAmount,

            bidderName:
            data.bidderName,

            bidderEmail:
            data.bidderEmail,

            bidderUserId:
            data.bidderUserId,

            bidderPhoto:
            data.bidderPhoto,

            status:
            data.status,

            notificationType:
                data.notificationType ||
                "created",

            oldBidAmount:
                data.oldBidAmount ??
                null,
        });


        console.log(
            "Bid notification response:",
            result.data
        );


        return result.data;

    } catch (error) {

        console.error(
            "Bid notification failed:",
            error
        );

        console.error(
            "Error code:",
            error?.code
        );

        console.error(
            "Error message:",
            error?.message
        );

        // -----------------------------------------------------
        // IMPORTANT
        // Notification failure must NOT break the actual
        // auction bid operation.
        // -----------------------------------------------------

        return null;
    }
}