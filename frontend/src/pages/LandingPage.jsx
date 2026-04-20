import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from "framer-motion";
import {
  SparklesIcon,
  BoltIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import timetablePreview from "../assets/timetable-preview.png";

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Interactive Particle Canvas (unchanged)
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      });
    }

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(99, 102, 241, 0.3)";

      for (let p of particles) {
        // mouse influence
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const angle = Math.atan2(dy, dx);
          const force = (100 - dist) * 0.0005;
          p.x -= Math.cos(angle) * force;
          p.y -= Math.sin(angle) * force;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 3D Tilt Card (unchanged)
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const TiltCard = ({ children, className = "" }) => {
  const ref = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: y * 10, y: x * 10 });
  };
  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
};

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Counter Component (unchanged)
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const Counter = ({ from = 0, to, duration = 2 }) => {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(from + (to - from) * progress));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, from, to, duration]);

  return <span ref={ref}>{count.toLocaleString()}+</span>;
};

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Feature Card (unchanged)
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const FeatureCard = ({ icon, title, description, gradient }) => (
  <TiltCard>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  </TiltCard>
);

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Contact Card Component (SAFE version)
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const ContactCard = ({ icon, title, detail, action, href }) => {
  // Safe check: if href is undefined, use "#" to prevent crash
  const safeHref = href || "#";
  const isExternal = safeHref.startsWith("http") || safeHref.startsWith("mailto") || safeHref.startsWith("tel");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition"
    >
      <div className="w-12 h-12 mx-auto bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-gray-400 mt-1">{detail}</p>
      <a
        href={safeHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="mt-4 inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
      >
        {action} <ArrowRightIcon className="w-4 h-4" />
      </a>
    </motion.div>
  );
};

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Main Component
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const stats = [
    { icon: BuildingLibraryIcon, label: "Colleges", value: 50 },
    { icon: UserGroupIcon, label: "Faculty", value: 10000 },
    { icon: AcademicCapIcon, label: "Students", value: 50000 },
    { icon: ClockIcon, label: "Timetables", value: 100000 },
  ];

  const features = [
    {
      icon: <BoltIcon className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Generate full timetables in under 30 minutes using parallel algorithms.",
      gradient: "from-yellow-400 to-orange-400",
    },
    {
      icon: <CheckCircleIcon className="w-6 h-6" />,
      title: "Zero Conflicts",
      description: "Hard constraints strictly enforced – no double‑booking, no clashes.",
      gradient: "from-green-400 to-emerald-400",
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: "Multi‑Objective",
      description: "Balances faculty preferences, student idle time, and resource utilization.",
      gradient: "from-purple-400 to-pink-400",
    },
    {
      icon: <GlobeAltIcon className="w-6 h-6" />,
      title: "Cloud Ready",
      description: "Deploy anywhere – scales to thousands of concurrent users.",
      gradient: "from-blue-400 to-cyan-400",
    },
    {
      icon: <UserGroupIcon className="w-6 h-6" />,
      title: "Role‑Based Access",
      description: "Tailored dashboards for admin, faculty, and students.",
      gradient: "from-indigo-400 to-purple-400",
    },
    {
      icon: <ArrowRightIcon className="w-6 h-6" />,
      title: "Export Anywhere",
      description: "PDF, Excel, or interactive web views – your choice.",
      gradient: "from-red-400 to-rose-400",
    },
  ];

  const contact = {
    email: "bhupendhragurjar@gmail.com",
    phone: "+917697535167",
    address: "Indore, India",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      <ParticleBackground />

      <motion.div
        style={{ y: gridY }}
        className="fixed inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] -z-10"
      />

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AutoSched
          </div>
          <div className="space-x-4">
            <Link to="/login" className="text-gray-300 hover:text-white transition">
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center text-center px-4 pt-16"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Automate College
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Timetables
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mt-6 max-w-3xl mx-auto"
          >
            The world's most advanced AI‑powered scheduler. <span className="text-indigo-400">Zero conflicts,</span>{" "}
            <span className="text-purple-400">maximum satisfaction.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            <Link
              to="/register"
              className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition shadow-2xl hover:shadow-indigo-500/25"
            >
              Start Free Trial
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-8 py-4 border border-indigo-400 text-indigo-400 rounded-full font-semibold hover:bg-indigo-400/10 transition"
            >
              Watch Demo
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent h-32 bottom-0 z-10" />
            <img
              src={timetablePreview}
              alt="Timetable Dashboard Preview"
              className="rounded-2xl shadow-2xl border border-white/10 w-full max-w-4xl mx-auto"
            />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <Icon className="w-6 h-6 mx-auto text-indigo-400 mb-2" />
                  <div className="text-3xl font-bold text-white">
                    <Counter from={0} to={stat.value} duration={2} />
                  </div>
                  <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
        >
          Why choose{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AutoSched
          </span>
          ?
        </motion.h2>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} />
          ))}
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
        >
          Meet the{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            visionary
          </span>
        </motion.h2>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-75 blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-1 rounded-3xl shadow-2xl">
              <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 p-1">
                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-5xl font-bold text-white">
                      GK
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">Gopala Kanva</h3>
                    <p className="text-indigo-300 text-lg">Founder & Lead Developer</p>
                    <p className="text-gray-400 mt-4">
                      "I built AutoSched to liberate educators from manual scheduling. Our hybrid GA‑CSP
                      engine is a decade of research condensed into a beautiful interface that anyone can use."
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <span className="px-4 py-2 bg-white/10 rounded-full text-sm flex items-center gap-2 text-gray-300">
                        <EnvelopeIcon className="w-4 h-4" /> gopalagurjar20@gmail.com
                      </span>
                      <span className="px-4 py-2 bg-white/10 rounded-full text-sm flex items-center gap-2 text-gray-300">
                        <PhoneIcon className="w-4 h-4" /> +91 7697535167
                      </span>
                      <span className="px-4 py-2 bg-white/10 rounded-full text-sm flex items-center gap-2 text-gray-300">
                        <MapPinIcon className="w-4 h-4" /> Indore, India
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section – UPDATED with safe href */}
      <section className="py-20 px-4 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            Get in{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              touch
            </span>
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ContactCard
              icon={<EnvelopeIcon className="w-6 h-6" />}
              title="Email"
              detail={contact.email}
              action="Send Message"
              href={`mailto:${contact.email}?subject=Inquiry%20from%20AutoSched%20Website`}
            />
            <ContactCard
              icon={<PhoneIcon className="w-6 h-6" />}
              title="Phone"
              detail={contact.phone}
              action="Call Now"
              href={`tel:${contact.phone.replace(/\s/g, '')}`}
            />
            <ContactCard
              icon={<MapPinIcon className="w-6 h-6" />}
              title="Address"
              detail={contact.address}
              action="Get Directions"
              href={`https://www.google.com/maps/search/${encodeURIComponent(contact.address)}`}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 border-t border-white/10">
        <p>© 2026 AutoSched. Made with ❤️ in India.</p>
      </footer>
    </div>
  );
}