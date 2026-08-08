const fs = require("fs");
const path = require("path");

const {
  initializeApp,
  cert,
} = require("firebase-admin/app");

const {
  getFirestore,
} = require("firebase-admin/firestore");

// ============================================================
// CONFIGURATION
// ============================================================

const serviceAccountPath = path.join(
  __dirname,
  "serviceAccountKey.json"
);

// ============================================================
// CHECK SERVICE ACCOUNT
// ============================================================

if (!fs.existsSync(serviceAccountPath)) {
  console.error("");
  console.error("ERROR: serviceAccountKey.json was not found.");
  console.error("");
  console.error("Expected location:");
  console.error(serviceAccountPath);
  console.error("");
  process.exit(1);
}

// ============================================================
// INITIALIZE FIREBASE ADMIN
// ============================================================

let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error("");
  console.error(
    "ERROR: Unable to read serviceAccountKey.json."
  );
  console.error("");
  console.error(error.message);
  console.error("");
  process.exit(1);
}

try {
  initializeApp({
    credential: cert(serviceAccount),
  });
} catch (error) {
  console.error("");
  console.error(
    "ERROR: Unable to initialize Firebase Admin."
  );
  console.error("");
  console.error(error.message);
  console.error("");
  process.exit(1);
}

const db = getFirestore();

// ============================================================
// FIRESTORE TYPE DETECTION
// ============================================================

function getFirestoreType(value) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  // Firestore Timestamp
  if (
    value &&
    typeof value.toDate === "function" &&
    typeof value.seconds === "number"
  ) {
    return "timestamp";
  }

  // Firestore GeoPoint
  if (
    value &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number"
  ) {
    return "geopoint";
  }

  // Firestore DocumentReference
  if (
    value &&
    typeof value.path === "string" &&
    value.constructor &&
    value.constructor.name === "DocumentReference"
  ) {
    return "reference";
  }

  // Buffer / bytes
  if (Buffer.isBuffer(value)) {
    return "bytes";
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "array<empty>";
    }

    const types = [
      ...new Set(
        value.map((item) =>
          getFirestoreType(item)
        )
      ),
    ];

    return `array<${types.join("|")}>`;
  }

  // Objects / maps
  if (typeof value === "object") {
    return "map";
  }

  // string / number / boolean
  return typeof value;
}

// ============================================================
// ANALYZE OBJECT / MAP
// ============================================================

function analyzeObject(obj) {
  const result = {};

  if (
    !obj ||
    typeof obj !== "object" ||
    Array.isArray(obj)
  ) {
    return result;
  }

  for (const [field, value] of Object.entries(obj)) {
    const type = getFirestoreType(value);

    if (type === "map") {
      result[field] = {
        type: "map",
        fields: analyzeObject(value),
      };
    } else {
      result[field] = {
        type,
      };
    }
  }

  return result;
}

// ============================================================
// MERGE SCHEMAS
// ============================================================

function mergeSchemas(existing, incoming) {
  for (const [field, info] of Object.entries(incoming)) {
    // New field
    if (!existing[field]) {
      existing[field] = info;
      continue;
    }

    const existingType =
      existing[field].type;

    const incomingType =
      info.type;

    // Same type
    if (existingType === incomingType) {
      // Merge nested map fields
      if (
        existingType === "map" &&
        info.fields
      ) {
        existing[field].fields =
          existing[field].fields || {};

        mergeSchemas(
          existing[field].fields,
          info.fields
        );
      }

      continue;
    }

    // Different types found in different documents
    const types = new Set();

    if (
      existingType &&
      existingType.startsWith("multiple:")
    ) {
      existingType
        .replace("multiple:", "")
        .split("|")
        .forEach((type) => {
          types.add(type);
        });
    } else {
      types.add(existingType);
    }

    if (
      incomingType &&
      incomingType.startsWith("multiple:")
    ) {
      incomingType
        .replace("multiple:", "")
        .split("|")
        .forEach((type) => {
          types.add(type);
        });
    } else {
      types.add(incomingType);
    }

    existing[field] = {
      type:
        "multiple:" +
        [...types]
          .filter(Boolean)
          .sort()
          .join("|"),
    };
  }

  return existing;
}

// ============================================================
// EXPORT FIRESTORE STRUCTURE
// ============================================================

async function exportFirestoreStructure() {
  console.log("");
  console.log(
    "=================================================="
  );
  console.log(
    "GVICE FIRESTORE STRUCTURE EXPORT"
  );
  console.log(
    "=================================================="
  );
  console.log("");

  console.log(
    "Connecting to Firestore..."
  );

  const collections =
    await db.listCollections();

  console.log(
    `Collections found: ${collections.length}`
  );

  console.log("");

  const output = {
    generatedAt:
      new Date().toISOString(),

    projectId:
      serviceAccount.project_id,

    collections: {},
  };

  // ==========================================================
  // PROCESS EACH COLLECTION
  // ==========================================================

  for (const collectionRef of collections) {
    const collectionName =
      collectionRef.id;

    console.log(
      `Reading collection: ${collectionName}`
    );

    const snapshot =
      await collectionRef.get();

    const schema = {};

    // --------------------------------------------------------
    // Analyze every document
    // --------------------------------------------------------

    for (const document of snapshot.docs) {
      const data = document.data();

      const documentSchema =
        analyzeObject(data);

      mergeSchemas(
        schema,
        documentSchema
      );
    }

    // --------------------------------------------------------
    // Save collection information
    // --------------------------------------------------------

    output.collections[
      collectionName
    ] = {
      documentCount:
        snapshot.size,

      fields: schema,
    };

    console.log(
      `  Documents: ${snapshot.size}`
    );

    console.log(
      `  Fields: ${Object.keys(schema).length}`
    );

    console.log("");
  }

  // ==========================================================
  // WRITE JSON FILE
  // ==========================================================

  const outputPath = path.join(
    __dirname,
    "firestore-structure.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      output,
      null,
      2
    ),
    "utf8"
  );

  // ==========================================================
  // COMPLETE
  // ==========================================================

  console.log(
    "=================================================="
  );

  console.log(
    "EXPORT COMPLETE"
  );

  console.log(
    "=================================================="
  );

  console.log("");

  console.log(
    "Structure report created:"
  );

  console.log(outputPath);

  console.log("");

  console.log(
    "The report contains collection names,"
  );

  console.log(
    "document counts, field names and data types."
  );

  console.log("");

  console.log(
    "IMPORTANT:"
  );

  console.log(
    "DO NOT share serviceAccountKey.json."
  );

  console.log("");
}

// ============================================================
// RUN
// ============================================================

exportFirestoreStructure()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error(
      "=================================================="
    );
    console.error(
      "FIRESTORE EXPORT FAILED"
    );
    console.error(
      "=================================================="
    );
    console.error("");

    console.error(
      error
    );

    console.error("");

    process.exit(1);
  });