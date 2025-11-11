'use client';
import React, { useState } from 'react';
import './help-support.css';

export default function HelpSupportPage() {
    const [activeTab, setActiveTab] = useState('guides');
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            question: "How do I add new inventory items?",
            answer: "Navigate to Inventory > Add Items, fill in the required fields including SKU, name, category, and initial stock quantity."
        },
        {
            question: "How do I process an RMA request?",
            answer: "Go to RMA Management > New RMA, select the customer and product, then follow the step-by-step process."
        },
        {
            question: "How can I generate audit reports?",
            answer: "Visit Audit Dashboard > Reports section, select your date range and filters, then export in your preferred format."
        }
    ];

    const contactMethods = [
        {
            icon: '📧',
            title: 'Email Support',
            details: 'inventory@texasmobilepcs.com',
            response: 'Response within 2 hours'
        },
        {
            icon: '💬',
            title: 'Live Chat',
            details: 'Available 5PM-8AM (PST)',
            response: 'Instant response during business hours'
        },
        {
            icon: '📞',
            title: 'Phone Support',
            details: ['+92 311 6584420', ' , ', '+92 310 2774543'],
            response: '24/7 for critical issues'
        }
    ];

    return (
        <div className="help-support-page">
            <div className="help-header">
                <h1>Help & Support</h1>
                <p>Get assistance with your Inventory Management System</p>

                {/* Search Bar */}
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search for help articles, guides, or FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button className="search-btn">Search</button>
                </div>
            </div>

            <div className="help-layout">
                {/* Sidebar Navigation */}
                <div className="help-sidebar">
                    <button
                        className={`help-tab ${activeTab === 'guides' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guides')}
                    >
                        📚 Getting Started
                    </button>
                    <button
                        className={`help-tab ${activeTab === 'faq' ? 'active' : ''}`}
                        onClick={() => setActiveTab('faq')}
                    >
                        ❓ FAQ
                    </button>
                    <button
                        className={`help-tab ${activeTab === 'contact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('contact')}
                    >
                        📞 Contact Support
                    </button>

                </div>

                {/* Main Content */}
                <div className="help-content">
                    {activeTab === 'guides' && <GuidesSection />}
                    {activeTab === 'faq' && <FAQSection faqs={faqs} />}
                    {activeTab === 'contact' && <ContactSection contactMethods={contactMethods} />}

                </div>
            </div>
        </div>
    );
}

// Guides Section Component
const GuidesSection = () => (
    <div className="help-section">
        <h2>Getting Started Guides</h2>

        <div className="guides-grid">
            <div className="guide-card">
                <div className="guide-icon">📊</div>
                <h3>Audit Dashboard</h3>
                <p>Learn how to conduct inventory audits, track status, and generate reports</p>
            </div>

            <div className="guide-card">
                <div className="guide-icon">📦</div>
                <h3>Inventory Management</h3>
                <p>Add, edit, and manage inventory items, categories, and stock levels</p>
            </div>

            <div className="guide-card">
                <div className="guide-icon">🔄</div>
                <h3>RMA Processing</h3>
                <p>Handle returns, repairs, and customer service requests efficiently</p>
            </div>

            <div className="guide-card">
                <div className="guide-icon">📈</div>
                <h3>Reports & Analytics</h3>
                <p>Generate insights and export data for business intelligence</p>
            </div>
        </div>
    </div>
);

// FAQ Section Component
const FAQSection = ({ faqs }: { faqs: any[] }) => (
    <div className="help-section">
        <h2>Frequently Asked Questions</h2>

        <div className="faq-list">
            {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                    <div className="faq-question">
                        <strong>Q: {faq.question}</strong>
                    </div>
                    <div className="faq-answer">
                        <strong>A:</strong> {faq.answer}
                    </div>
                </div>
            ))}
        </div>

        <div className="faq-contact-prompt">
            <p>Can't find what you're looking for?</p>
            <button className="contact-prompt-btn">Contact Support Team</button>
        </div>
    </div>
);

// Contact Section Component
const ContactSection = ({ contactMethods }: { contactMethods: any[] }) => (
    <div className="help-section">
        <h2>Contact Support</h2>
        <p className="contact-intro">Our support team is here to help you with any issues or questions.</p>

        <div className="contact-methods">
            {contactMethods.map((method, index) => (
                <div key={index} className="contact-card">
                    <div className="contact-icon">{method.icon}</div>
                    <div className="contact-info">
                        <h3>{method.title}</h3>
                        <p className="contact-detail">{method.details}</p>
                        <p className="contact-response">{method.response}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Resources Section Component
const ResourcesSection = () => (
    <div className="help-section">
        <h2>Additional Resources</h2>

        <div className="resources-grid">

            <div className="resource-card">
                <h3>🎥 Video Tutorials</h3>
                <p>Step-by-step video guides for all features</p>
                <button className="resource-btn">Watch Videos</button>
            </div>

            <div className="resource-card">
                <h3>📖 User Manual</h3>
                <p>Comprehensive PDF guide for all modules</p>
                <button className="resource-btn">Download PDF</button>
            </div>

            <div className="resource-card">
                <h3>🔄 System Status</h3>
                <p>Check current system performance and uptime</p>
                <button className="resource-btn">Check Status</button>
            </div>
        </div>
    </div>
);