import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Public Pages
const Home = lazy(() => import("./pages/Home"));
const Auction = lazy(() => import("./pages/Auction"));
const NewsRoom = lazy(() => import("./pages/NewsRoom"));
const Tenders = lazy(() => import("./pages/Tenders"));
const Projects = lazy(() => import("./pages/Projects"));
const Article = lazy(() => import("./pages/Article"));
const SeedData = lazy(() => import("./pages/SeedData"));

// Authentication
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));

// Account Pages
const AccountPage = lazy(() => import("./pages/AccountPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MyBidsPage = lazy(() => import("./pages/MyBidsPage"));
const ReceivedBidsPage = lazy(() => import("./pages/ReceivedBidsPage"));

// Admin
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageNews = lazy(() => import("./pages/admin/ManageNews"));
const ManageTenders = lazy(() => import("./pages/admin/ManageTenders"));
const ManageEquipment = lazy(() => import("./pages/admin/ManageEquipment"));
const ManageProjects = lazy(() => import("./pages/admin/ManageProjects"));
const ManageBids = lazy(() => import("./pages/admin/ManageBids"));

function App() {
    return (
        <div>
            <Navbar />

            <main className="main-content">
                <Suspense
                    fallback={
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "100vh",
                                color: "#888",
                            }}
                        >
                            Loading...
                        </div>
                    }
                >
                    <Routes>
                        {/* Public Routes */}

                        <Route
                            path="/"
                            element={<Home />}
                        />

                        <Route
                            path="/auction"
                            element={
                                <ProtectedRoute>
                                    <Auction />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/news"
                            element={<NewsRoom />}
                        />

                        <Route
                            path="/tenders"
                            element={<Tenders />}
                        />

                        <Route
                            path="/projects"
                            element={<Projects />}
                        />

                        <Route
                            path="/article/:id"
                            element={<Article />}
                        />

                        <Route
                            path="/seed"
                            element={<SeedData />}
                        />

                        {/* User Account */}

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <AccountPage />
                                </ProtectedRoute>
                            }
                        >
                            {/* Profile */}
                            <Route
                                index
                                element={<ProfilePage />}
                            />

                            {/* My Bids */}
                            <Route
                                path="bids"
                                element={<MyBidsPage />}
                            />

                            {/* Received Bids */}
                            <Route
                                path="received-bids"
                                element={<ReceivedBidsPage />}
                            />

                            {/* Admin Area */}

                            <Route element={<AdminRoute />}>
                                <Route
                                    path="admin"
                                    element={<AdminLayout />}
                                >
                                    <Route
                                        index
                                        element={<AdminDashboard />}
                                    />

                                    <Route
                                        path="news"
                                        element={<ManageNews />}
                                    />

                                    <Route
                                        path="tenders"
                                        element={<ManageTenders />}
                                    />

                                    <Route
                                        path="equipment"
                                        element={<ManageEquipment />}
                                    />

                                    <Route
                                        path="projects"
                                        element={<ManageProjects />}
                                    />

                                    <Route
                                        path="bids"
                                        element={<ManageBids />}
                                    />
                                </Route>
                            </Route>
                        </Route>

                        {/* Fallback */}

                        <Route
                            path="*"
                            element={<Home />}
                        />
                    </Routes>
                </Suspense>
            </main>

            <Footer />
        </div>
    );
}

export default App;