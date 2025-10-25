import './index.css';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './Layout'; 

const AboutPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="container mx-auto p-4">
      <section className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">About Our Project</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Welcome to our AI-powered application. We've built this platform to demonstrate the capabilities of modern AI in improving everyday tasks.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Our Mission</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our mission is to make AI accessible to everyone, providing tools that simplify complex tasks and enhance productivity. We believe in creating technology that serves people in meaningful ways.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Our Team</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We are a passionate team of developers, designers, and AI enthusiasts working together to push the boundaries of what's possible with conversational AI and machine learning.
            </p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Technology Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["React", "TypeScript", "TailwindCSS", "Python", "FastAPI", "Machine Learning", "OpenAI", "MongoDB"].map((tech) => (
              <div key={tech} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm text-center">
                <span className="text-gray-700 dark:text-gray-300">{tech}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Get In Touch</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We're always looking to improve our platform and welcome any feedback or questions you might have.
          </p>
          <Link to="/contact" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Contact Us
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;