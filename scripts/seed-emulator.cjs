const fs = require("fs");
const path = require("path");

const {
    initializeApp,
    cert,
} = require("firebase-admin/app");

const {
    getFirestore,
} = require("firebase-admin/firestore");

const {
    getAuth,
} = require("firebase-admin/auth");


// =====================================================
// CONFIGURATION
// =====================================================

const PROJECT_ID = "gvice-user-dev";

const SERVICE_ACCOUNT_PATH =
    path.resolve(
        __dirname,
        "../firestore-schema-export/serviceAccountKey.json"
    );

const AUTH_EXPORT_PATH =
    path.resolve(
        __dirname,
        "auth-users.json"
    );

const FIRESTORE_EMULATOR_HOST =
    "127.0.0.1:8080";

const AUTH_EMULATOR_HOST =
    "127.0.0.1:9099";


// Collections we want to copy
const COLLECTIONS = [
    "admins",
    "auctionBids",
    "equipmentListings",
    "news",
    "products",
    "projects",
    "tenders",
    "users",
];


// =====================================================
// VALIDATION
// =====================================================

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(
        "ERROR: Service account key not found:"
    );

    console.error(
        SERVICE_ACCOUNT_PATH
    );

    process.exit(1);
}

if (!fs.existsSync(AUTH_EXPORT_PATH)) {
    console.error(
        "ERROR: Auth export not found:"
    );

    console.error(
        AUTH_EXPORT_PATH
    );

    console.error(
        "Run firebase auth:export first."
    );

    process.exit(1);
}


// =====================================================
// IMPORTANT
// =====================================================
//
// We intentionally connect the Admin SDK to the
// LOCAL EMULATORS for writes.
//
// Production Firestore is accessed separately using
// a production Admin SDK instance.
//
// This prevents accidental local -> production writes.
// =====================================================


// -----------------------------------------------------
// Production Firebase Admin
// -----------------------------------------------------

const serviceAccount =
    require(SERVICE_ACCOUNT_PATH);

const productionApp =
    initializeApp(
        {
            credential:
                cert(serviceAccount),

            projectId:
            PROJECT_ID,
        },
        "production"
    );

const productionDb =
    getFirestore(productionApp);


// -----------------------------------------------------
// Local Firestore Emulator
// -----------------------------------------------------

process.env.FIRESTORE_EMULATOR_HOST =
    FIRESTORE_EMULATOR_HOST;

process.env.FIREBASE_AUTH_EMULATOR_HOST =
    AUTH_EMULATOR_HOST;


// A separate Admin app for the local emulator.
const emulatorApp =
    initializeApp(
        {
            projectId:
            PROJECT_ID,
        },
        "emulator"
    );

const emulatorDb =
    getFirestore(emulatorApp);

const emulatorAuth =
    getAuth(emulatorApp);


// =====================================================
// COPY FIRESTORE
// =====================================================

async function copyCollection(
    collectionName
) {
    console.log(
        `\nCopying collection: ${collectionName}`
    );

    const snapshot =
        await productionDb
            .collection(collectionName)
            .get();

    console.log(
        `Production documents: ${snapshot.size}`
    );

    if (snapshot.empty) {
        console.log(
            `Collection ${collectionName} is empty.`
        );

        return 0;
    }

    let count = 0;

    let batch =
        emulatorDb.batch();

    let batchCount = 0;

    const commitBatch =
        async () => {
            if (batchCount === 0) {
                return;
            }

            await batch.commit();

            batch =
                emulatorDb.batch();

            batchCount = 0;
        };


    for (
        const document of snapshot.docs
        ) {

        const targetRef =
            emulatorDb
                .collection(collectionName)
                .doc(document.id);


        // -------------------------------------------------
        // USERS
        // -------------------------------------------------
        //
        // Do not copy FCM token subcollections.
        //
        // We copy the user document itself.
        // -------------------------------------------------

        if (
            collectionName ===
            "users"
        ) {

            const data =
                document.data();

            const cleanedData =
                {
                    ...data,
                };

            delete cleanedData.fcmTokens;

            batch.set(
                targetRef,
                cleanedData
            );

        } else {

            batch.set(
                targetRef,
                document.data()
            );
        }


        batchCount++;
        count++;


        // Firestore batch maximum is 500.
        if (
            batchCount >= 450
        ) {
            await commitBatch();
        }
    }


    await commitBatch();

    console.log(
        `Copied ${count} documents from ${collectionName}.`
    );

    return count;
}


// =====================================================
// COPY USER SUBCOLLECTIONS
// =====================================================
//
// We intentionally DO NOT copy:
//
// users/{uid}/fcmTokens
//
// FCM tokens are browser/environment specific.
// =====================================================


// =====================================================
// AUTHENTICATION
// =====================================================

async function importAuthUsers() {

    console.log(
        "\nImporting Authentication users..."
    );

    const authExport =
        JSON.parse(
            fs.readFileSync(
                AUTH_EXPORT_PATH,
                "utf8"
            )
        );


    // Firebase auth:export produces:
    //
    // {
    //   users: [...]
    // }
    //

    const users =
        authExport.users || [];


    console.log(
        `Production Auth users found: ${users.length}`
    );


    let imported = 0;
    let skipped = 0;


    for (
        const user of users
        ) {

        try {

            // ---------------------------------------------
            // Check whether the UID already exists
            // ---------------------------------------------

            try {

                await emulatorAuth
                    .getUser(
                        user.localId
                    );

                console.log(
                    `Auth user already exists: ${user.email || user.localId}`
                );

                skipped++;

                continue;

            } catch (error) {

                // Expected:
                // user-not-found
                //
                // Continue with creation.

                if (
                    error.code !==
                    "auth/user-not-found"
                ) {
                    throw error;
                }
            }


            // ---------------------------------------------
            // Create local Auth user
            // ---------------------------------------------

            const createRequest = {
                uid:
                user.localId,

                email:
                    user.email || undefined,

                emailVerified:
                    user.emailVerified === true,

                displayName:
                    user.displayName || undefined,

                disabled:
                    user.disabled === true,

                photoURL:
                    user.photoUrl || undefined,

                phoneNumber:
                    user.phoneNumber || undefined,
            };


            // Remove undefined values.
            Object.keys(
                createRequest
            ).forEach(
                (key) => {

                    if (
                        createRequest[key] ===
                        undefined
                    ) {
                        delete createRequest[key];
                    }

                }
            );


            await emulatorAuth
                .createUser(
                    createRequest
                );


            console.log(
                `Imported Auth user: ${user.email || user.localId}`
            );

            imported++;

        } catch (error) {

            console.error(
                `Failed to import Auth user ${user.email || user.localId}:`,
                error.message
            );
        }
    }


    console.log(
        `Auth import completed. Imported: ${imported}, skipped: ${skipped}`
    );
}


// =====================================================
// VERIFY
// =====================================================

async function verifyCollection(
    collectionName
) {

    const snapshot =
        await emulatorDb
            .collection(collectionName)
            .get();

    console.log(
        `Local ${collectionName}: ${snapshot.size}`
    );

    return snapshot.size;
}


// =====================================================
// MAIN
// =====================================================

async function main() {

    console.log(
        "\n=============================================="
    );

    console.log(
        "GVICE PRODUCTION → LOCAL EMULATOR SEED"
    );

    console.log(
        "=============================================="
    );

    console.log(
        `Project: ${PROJECT_ID}`
    );

    console.log(
        `Firestore Emulator: ${FIRESTORE_EMULATOR_HOST}`
    );

    console.log(
        `Auth Emulator: ${AUTH_EMULATOR_HOST}`
    );


    console.log(
        "\nIMPORTANT:"
    );

    console.log(
        "Production is READ ONLY."
    );

    console.log(
        "Writes go ONLY to the local emulator."
    );


    // -------------------------------------------------
    // Firestore
    // -------------------------------------------------

    for (
        const collectionName
        of COLLECTIONS
        ) {

        await copyCollection(
            collectionName
        );
    }


    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    await importAuthUsers();


    // -------------------------------------------------
    // Verification
    // -------------------------------------------------

    console.log(
        "\n=============================================="
    );

    console.log(
        "VERIFYING LOCAL DATA"
    );

    console.log(
        "=============================================="
    );


    for (
        const collectionName
        of COLLECTIONS
        ) {

        await verifyCollection(
            collectionName
        );
    }


    console.log(
        "\n=============================================="
    );

    console.log(
        "SEED COMPLETED SUCCESSFULLY"
    );

    console.log(
        "=============================================="
    );

    console.log(
        "\nFCM tokens were intentionally NOT copied."
    );

    console.log(
        "Local browsers will create their own FCM tokens."
    );
}


// =====================================================
// RUN
// =====================================================

main()
    .catch(
        (error) => {

            console.error(
                "\nSEED FAILED:"
            );

            console.error(
                error
            );

            process.exit(1);
        }
    );