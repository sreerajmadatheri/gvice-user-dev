import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import Footer from "../components/Footer";


const Projects = () => {

    const [projects, setProjects] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =====================================================
    // LOAD PROJECTS
    // =====================================================

    useEffect(() => {

        const fetchProjects = async () => {

            setLoading(true);
            setError("");

            try {

                const snap =
                    await getDocs(
                        collection(db, "projects")
                    );


                /*
                 * Keep the real Firestore document ID
                 * internally.
                 *
                 * The ID is not displayed on the public page.
                 */

                const data =
                    snap.docs.map((doc) => ({
                        ...doc.data(),
                        id: doc.id,
                    }));


                setProjects(data);

            } catch (err) {

                console.error(
                    "Failed to load projects:",
                    err
                );

                setError(
                    "Unable to load projects."
                );

            } finally {

                setLoading(false);

            }

        };


        fetchProjects();

    }, []);


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
            PAGE HEADER
        ================================================= */}

                <div className="section-header">

                    <h2>
                        Projects
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
                            Loading projects...
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
            PROJECT TABLE
        ================================================= */}

                {!loading &&
                    !error &&
                    projects.length > 0 && (

                        <div
                            className="tenders-list glass-panel"
                        >

                            {/* ---------------------------------------------
                  HEADER
              --------------------------------------------- */}

                            <div
                                className="tender-header"
                                style={{
                                    gridTemplateColumns:
                                        "2fr 1fr 1fr 1fr",
                                }}
                            >

                <span>
                  Project
                </span>

                                <span>
                  Sector
                </span>

                                <span>
                  Status
                </span>

                                <span>
                  Budget
                </span>

                            </div>


                            {/* ---------------------------------------------
                  PROJECTS
              --------------------------------------------- */}

                            {projects.map(
                                (project) => (

                                    <div
                                        className="tender-row"
                                        key={project.id}
                                        style={{
                                            gridTemplateColumns:
                                                "2fr 1fr 1fr 1fr",
                                        }}
                                    >

                    <span className="tender-title">
                      {project.name || "-"}
                    </span>

                                        <span className="tender-client">
                      {project.sector || "-"}
                    </span>

                                        <span className="tender-status status-open">
                      {project.status || "-"}
                    </span>

                                        <span className="tender-value">
                      {project.budget || "-"}
                    </span>

                                    </div>

                                )
                            )}

                        </div>

                    )}


                {/* =================================================
            NO PROJECTS
        ================================================= */}

                {!loading &&
                    !error &&
                    projects.length === 0 && (

                        <div
                            className="glass-panel"
                            style={{
                                padding: "2rem",
                                textAlign: "center",
                            }}
                        >

                            <p>
                                No projects found.
                            </p>

                        </div>

                    )}

            </div>


            <Footer />

        </>
    );
};


export default Projects;