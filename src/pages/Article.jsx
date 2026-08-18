import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../lib/firebase";

import {
  mockNews,
  mockTenders,
  mockProjects,
} from "../data/mockData";

import SubscriptionSection from "../components/SubscriptionSection";
import Footer from "../components/Footer";

import "./Article.css";


const Article = () => {

  const { id } = useParams();

  const [article, setArticle] = useState(null);

  const [loading, setLoading] =
      useState(true);

  const [notFound, setNotFound] =
      useState(false);


  // =====================================================
  // LOAD ARTICLE
  // =====================================================

  useEffect(() => {

    const fetchArticle = async () => {

      setLoading(true);

      setNotFound(false);


      try {

        // -------------------------------------------------
        // First: Try Firestore NEWS
        // -------------------------------------------------

        const newsRef =
            doc(db, "news", id);

        const newsSnap =
            await getDoc(newsRef);


        if (newsSnap.exists()) {

          setArticle({
            id: newsSnap.id,
            ...newsSnap.data(),
          });

          setLoading(false);

          return;
        }


        // -------------------------------------------------
        // Fallback: Existing mock data
        // -------------------------------------------------

        const allData = [
          ...mockNews,
          ...mockTenders,
          ...mockProjects,
        ];


        const mockArticle =
            allData.find(
                (item) =>
                    item.id?.toString() === id
            );


        if (mockArticle) {

          setArticle(
              mockArticle
          );

        } else {

          setNotFound(true);
        }


      } catch (error) {

        console.error(
            "Error loading article:",
            error
        );


        // -------------------------------------------------
        // Fallback to mock data if Firestore fails
        // -------------------------------------------------

        const allData = [
          ...mockNews,
          ...mockTenders,
          ...mockProjects,
        ];


        const mockArticle =
            allData.find(
                (item) =>
                    item.id?.toString() === id
            );


        if (mockArticle) {

          setArticle(
              mockArticle
          );

        } else {

          setNotFound(true);
        }

      } finally {

        setLoading(false);
      }
    };


    if (id) {

      fetchArticle();

    } else {

      setLoading(false);

      setNotFound(true);
    }

  }, [id]);


  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {

    return (
        <div
            className="container"
            style={{
              paddingTop: "4rem",
              minHeight: "60vh",
            }}
        >

          <h2>
            Loading article...
          </h2>

        </div>
    );
  }


  // =====================================================
  // ARTICLE NOT FOUND
  // =====================================================

  if (
      notFound ||
      !article
  ) {

    return (
        <div
            className="container"
            style={{
              paddingTop: "4rem",
              minHeight: "60vh",
            }}
        >

          <h2>
            Article not found
          </h2>


          <Link
              to="/"
              className="back-link"
          >

            <ArrowLeft
                size={16}
            />

            Back to Home

          </Link>

        </div>
    );
  }


  // =====================================================
  // ARTICLE DATA
  // =====================================================

  const title =
      article.title ||
      article.name ||
      "Article";


  const category =
      article.category ||
      article.sector ||
      "";


  const author =
      article.author
          ? `By ${article.author}`
          : article.client
              ? article.client
              : "";


  const date =
      article.date ||
      article.deadline ||
      "";


  const image =
      article.image ||
      article.img ||
      "";


  const excerpt =
      article.excerpt ||
      "";


  const body =
      article.body ||
      "";


  // =====================================================
  // RENDER
  // =====================================================

  return (

      <div className="article-page">

        <div className="container article-container">


          {/* =================================================
            BACK
        ================================================= */}

          <Link
              to="/news"
              className="back-link"
          >

            <ArrowLeft
                size={16}
            />

            Back to News

          </Link>


          {/* =================================================
            HEADER
        ================================================= */}

          <header className="article-header">


            {category && (

                <span
                    className="article-category"
                >

              {category}

            </span>

            )}


            <h1
                className="article-title"
            >

              {title}

            </h1>


            <div
                className="article-meta"
            >

              {author && (

                  <span
                      className="article-author"
                  >

                {author}

              </span>

              )}


              {date && (

                  <span
                      className="article-date"
                  >

                {date}

              </span>

              )}

            </div>


          </header>


          {/* =================================================
            FEATURED IMAGE
        ================================================= */}

          {image && (

              <div
                  className="article-featured-image"
              >

                <img
                    src={image}
                    alt={title}
                />

              </div>

          )}


          {/* =================================================
            ARTICLE CONTENT
        ================================================= */}

          <div
              className="article-content"
          >


            {/* -------------------------------------------------
              EXCERPT
          ------------------------------------------------- */}

            {excerpt && (

                <p
                    className="article-lead"
                >

                  {excerpt}

                </p>

            )}


            {/* -------------------------------------------------
              FULL ARTICLE BODY
          ------------------------------------------------- */}

            {body && (

                <div
                    className="article-body"
                    dangerouslySetInnerHTML={{
                      __html: body,
                    }}
                />

            )}


            {/* -------------------------------------------------
              No Body
          ------------------------------------------------- */}

            {!body && !excerpt && (

                <p>
                  No article content
                  is available.
                </p>

            )}


          </div>


        </div>


        {/* =====================================================
          SUBSCRIPTION
      ===================================================== */}

        <SubscriptionSection />


        {/* =====================================================
          FOOTER
      ===================================================== */}

        <Footer />

      </div>

  );
};


export default Article;