import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import { mockTenders } from "../data/mockData";

import Footer from "../components/Footer";

import "../pages/Home.css";


const Tenders = () => {

  const [tendersList, setTendersList] =
      useState([]);

  const [loading, setLoading] =
      useState(true);

  const [error, setError] =
      useState("");


  // =====================================================
  // LOAD TENDERS
  // =====================================================

  useEffect(() => {

    const fetchTenders = async () => {

      setLoading(true);
      setError("");

      try {

        const snap =
            await getDocs(
                collection(db, "tenders")
            );


        if (!snap.empty) {

          /*
           * IMPORTANT:
           *
           * Spread Firestore data FIRST.
           * Assign the actual Firestore document ID LAST.
           *
           * This keeps the real document ID available
           * internally without displaying it publicly.
           */

          const data =
              snap.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
              }));


          setTendersList(data);

        } else {

          setTendersList(
              mockTenders.map(
                  (tender, index) => ({
                    ...tender,
                    id:
                        tender.id ??
                        `mock-tender-${index}`,
                  })
              )
          );

        }

      } catch (error) {

        console.error(
            "Failed to load tenders:",
            error
        );


        setError(
            "Unable to load tenders."
        );


        /*
         * Keep mock data as fallback.
         */

        setTendersList(
            mockTenders.map(
                (tender, index) => ({
                  ...tender,
                  id:
                      tender.id ??
                      `mock-tender-${index}`,
                })
            )
        );

      } finally {

        setLoading(false);

      }

    };


    fetchTenders();

  }, []);


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
      status
  ) => {

    return (
        `status-${
            (status || "Open")
                .toLowerCase()
                .replace(/\s+/g, "-")
        }`
    );

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
      <>

        <div
            className="container"
            style={{
              paddingTop: "4rem",
              paddingBottom: "4rem",
              minHeight:
                  "calc(100vh - 300px)",
            }}
        >

          {/* =================================================
            HEADER
        ================================================= */}

          <div className="section-header">

            <h2>
              All Tenders
            </h2>

          </div>


          {/* =================================================
            LOADING
        ================================================= */}

          {loading && (

              <div
                  className="glass-panel"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                  }}
              >

                <p>
                  Loading tenders...
                </p>

              </div>

          )}


          {/* =================================================
            ERROR
        ================================================= */}

          {!loading && error && (

              <div
                  className="glass-panel"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#b91c1c",
                  }}
              >

                <p>
                  {error}
                </p>

              </div>

          )}


          {/* =================================================
            TENDERS LIST
        ================================================= */}

          {!loading &&
              !error &&
              tendersList.length > 0 && (

                  <div
                      className="tenders-list glass-panel"
                  >

                    {/* -------------------------------------------------
                  HEADER
              ------------------------------------------------- */}

                    <div
                        className="tender-header"
                        style={{
                          gridTemplateColumns:
                              "2fr 1.2fr 1fr 1fr",
                        }}
                    >

                <span>
                  Title
                </span>

                      <span>
                  Client
                </span>

                      <span>
                  Value
                </span>

                      <span>
                  Status
                </span>

                    </div>


                    {/* -------------------------------------------------
                  TENDERS
              ------------------------------------------------- */}

                    {tendersList.map(
                        (tender) => (

                            <div
                                className="tender-row"
                                key={tender.id}
                                style={{
                                  gridTemplateColumns:
                                      "2fr 1.2fr 1fr 1fr",
                                }}
                            >

                    <span className="tender-title">
                      {tender.title || "-"}
                    </span>

                              <span className="tender-client">
                      {tender.client || "-"}
                    </span>

                              <span className="tender-value">
                      {tender.value || "-"}
                    </span>

                              <span
                                  className={`tender-status ${getStatusClass(
                                      tender.status
                                  )}`}
                              >
                      {tender.status || "Open"}
                    </span>

                            </div>

                        )
                    )}

                  </div>

              )}


          {/* =================================================
            NO TENDERS
        ================================================= */}

          {!loading &&
              !error &&
              tendersList.length === 0 && (

                  <div
                      className="glass-panel"
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                      }}
                  >

                    <p>
                      No tenders found.
                    </p>

                  </div>

              )}

        </div>


        <Footer />

      </>
  );
};


export default Tenders;