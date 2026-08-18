import { useState, useEffect, useMemo } from "react";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import { mockNews } from "../data/mockData";

import NewsCard from "../components/NewsCard";

import Footer from "../components/Footer";


const NewsRoom = () => {

    const [allNews, setAllNews] = useState([]);

    const [sortOrder, setSortOrder] = useState("latest");

    const [loading, setLoading] = useState(true);


    // =====================================================
    // LOAD NEWS
    // =====================================================

    useEffect(() => {

        const fetchNews = async () => {

            setLoading(true);

            try {

                const snapshot = await getDocs(
                    collection(db, "news")
                );


                if (!snapshot.empty) {

                    /*
                     * IMPORTANT:
                     *
                     * Spread the Firestore data FIRST.
                     * Put doc.id LAST.
                     *
                     * This guarantees that the actual Firestore
                     * document ID is used even if an old document
                     * contains its own "id" field.
                     */

                    const data = snapshot.docs.map((doc) => ({
                        ...doc.data(),
                        id: doc.id,
                    }));


                    setAllNews(data);

                } else {

                    setAllNews(
                        mockNews.map((news, index) => ({
                            ...news,
                            id:
                                news.id ??
                                `mock-news-${index}`,
                        }))
                    );

                }

            } catch (error) {

                console.error(
                    "Error fetching news from Firebase:",
                    error
                );

                /*
                 * Fallback to mock data.
                 */

                setAllNews(
                    mockNews.map((news, index) => ({
                        ...news,
                        id:
                            news.id ??
                            `mock-news-${index}`,
                    }))
                );

            } finally {

                setLoading(false);

            }

        };


        fetchNews();

    }, []);


    // =====================================================
    // GET NEWS DATE
    // =====================================================

    const getNewsDate = (news) => {

        // -----------------------------------------------
        // Firestore Timestamp
        // -----------------------------------------------

        if (
            news.createdAt &&
            typeof news.createdAt.toMillis === "function"
        ) {

            return news.createdAt.toMillis();

        }


        // -----------------------------------------------
        // JavaScript Date
        // -----------------------------------------------

        if (
            news.createdAt instanceof Date
        ) {

            return news.createdAt.getTime();

        }


        // -----------------------------------------------
        // Numeric timestamp
        // -----------------------------------------------

        if (
            typeof news.createdAt === "number"
        ) {

            return news.createdAt;

        }


        // -----------------------------------------------
        // String createdAt
        // -----------------------------------------------

        if (
            typeof news.createdAt === "string"
        ) {

            const timestamp =
                Date.parse(news.createdAt);

            if (!Number.isNaN(timestamp)) {

                return timestamp;

            }

        }


        // -----------------------------------------------
        // Existing date field
        // -----------------------------------------------

        if (news.date) {

            /*
             * Try normal JavaScript date parsing first.
             */

            const timestamp =
                Date.parse(news.date);

            if (!Number.isNaN(timestamp)) {

                return timestamp;

            }


            /*
             * Try numeric date values.
             */

            const numericDate =
                Number(news.date);

            if (!Number.isNaN(numericDate)) {

                return numericDate;

            }

        }


        /*
         * Unknown date.
         *
         * These articles will remain available,
         * but will sort to the bottom.
         */

        return 0;

    };


    // =====================================================
    // FILTER + SORT NEWS
    // =====================================================

    const newsList = useMemo(() => {

        let result = [...allNews];


        // ===================================================
        // FEATURED
        // ===================================================

        if (sortOrder === "featured") {

            result = result.filter(
                (news) =>
                    news.featured === true ||
                    news.isFeatured === true
            );

        }


        // ===================================================
        // LATEST
        // ===================================================

        if (
            sortOrder === "latest" ||
            sortOrder === "all" ||
            sortOrder === "featured"
        ) {

            result.sort(
                (a, b) =>
                    getNewsDate(b) -
                    getNewsDate(a)
            );

        }


        // ===================================================
        // OLDEST
        // ===================================================

        if (sortOrder === "oldest") {

            result.sort(
                (a, b) =>
                    getNewsDate(a) -
                    getNewsDate(b)
            );

        }


        return result;

    }, [
        allNews,
        sortOrder,
    ]);


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

                <div
                    className="section-header"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "2rem",
                        flexWrap: "wrap",
                    }}
                >

                    <h2
                        style={{
                            margin: 0,
                        }}
                    >
                        News Room
                    </h2>


                    {/* =================================================
              FILTER
          ================================================= */}

                    <select
                        value={sortOrder}
                        onChange={(event) => {
                            setSortOrder(event.target.value);
                        }}
                        style={{
                            padding:
                                "0.65rem 1rem",

                            border:
                                "1px solid #d1d5db",

                            borderRadius:
                                "6px",

                            background:
                                "#ffffff",

                            color:
                                "#374151",

                            cursor:
                                "pointer",

                            fontSize:
                                "0.95rem",

                            minWidth:
                                "170px",
                        }}
                    >

                        <option value="latest">
                            Latest News
                        </option>

                        <option value="all">
                            All News
                        </option>

                        <option value="oldest">
                            Oldest News
                        </option>

                        <option value="featured">
                            Featured
                        </option>

                    </select>

                </div>


                {/* =================================================
            LOADING
        ================================================= */}

                {loading && (

                    <div
                        style={{
                            padding: "4rem 0",
                            textAlign: "center",
                        }}
                    >

                        <p>
                            Loading news...
                        </p>

                    </div>

                )}


                {/* =================================================
            NO RESULTS
        ================================================= */}

                {!loading &&
                    newsList.length === 0 && (

                        <div
                            style={{
                                padding: "4rem 0",
                                textAlign: "center",
                            }}
                        >

                            <h3>
                                No news found
                            </h3>


                            {sortOrder === "featured" && (

                                <p>
                                    There are currently no
                                    featured news articles.
                                </p>

                            )}

                        </div>

                    )}


                {/* =================================================
            NEWS GRID
        ================================================= */}

                {!loading &&
                    newsList.length > 0 && (

                        <div
                            style={{
                                display: "grid",

                                gridTemplateColumns:
                                    "repeat(auto-fill, minmax(300px, 1fr))",

                                gap: "2rem",
                            }}
                        >

                            {newsList.map(
                                (news, index) => (

                                    <NewsCard
                                        key={`news-${news.id}-${index}`}
                                        news={news}
                                    />

                                )
                            )}

                        </div>

                    )}

            </div>


            <Footer />

        </>
    );

};


export default NewsRoom;