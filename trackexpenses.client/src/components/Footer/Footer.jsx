const Footer = () => {
    return (
      <footer className="bg-gray-900 text-white py-6 mt-10">
        <div className="container mx-auto flex flex-col items-center justify-center px-6 text-center">
          {/* Texto completamente centralizado */}
          <p className="text-sm">&copy; {new Date().getFullYear()} TrackExpenses. All rights reserved.</p>
          
          {/* Links abaixo do texto, centralizados */}
          <div className="flex space-x-4 mt-4">
            <a href="#" className="hover:text-gray-400 transition">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400 transition">Terms of Service</a>
            <a href="#" className="hover:text-gray-400 transition">Contact</a>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  