import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import './Register.css'
import Logo from '../assets/Logo.jpeg'
import axios from 'axios';

function Register() {
    const [username, setName] = useState("")
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errors, setErrors] = useState({
        username: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let newErrors: any = {};

        if (!username) newErrors.username = "Username is required.";
        if (!phone) newErrors.phone = "Phone number is required.";
        if (!email) newErrors.email = "Email is required.";
        if (!password) newErrors.password = "Password is required.";
        if (!confirmPassword) newErrors.confirmPassword = "Confirm Password is required.";

        if (phone && phone.length < 10) {
            newErrors.phone = "Phone number must be at least 10 digits.";
        }

        if (email && !/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Invalid email format.";
        }

        if (password && password.length < 8) {
            newErrors.password = "Password must be at least 8 characters.";
        }

        if (password && confirmPassword && password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const data = {
            username,
            phone,
            email,
            password,
            password_confirmation: confirmPassword,
        };

        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/auth/register",
                data
            );

            console.log(response.data);
            setShowSuccessModal(true);
            localStorage.setItem("token", response.data.token);

        } catch (error: any) {
            console.error(error);

            if (error.response?.data?.message?.toLowerCase().includes("email")) {
                setErrors((prev: any) => ({
                    ...prev,
                    email: "Email ID already registered."
                }));
            } else {
            }
        }
    };

    useEffect(() => {
        if (showSuccessModal) {
            const timer = setTimeout(() => {
                navigate("/login");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal, navigate]);

    return (
        <div className="register-container">
            <img src={Logo} alt="Logo" className="logoss" />
            <form className='register-form' onSubmit={handleSubmit}>
                <h1 className="text">Create Your Account!</h1>
                <h1>Register</h1>

                <label>Username:</label>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setName(e.target.value)}
                />
                {errors.username && <p className="error">{errors.username}</p>}

                <label>Phone Number:</label>
                <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
                {errors.phone && <p className="error">{errors.phone}</p>}

                <label>Email:</label>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="error">{errors.email}</p>}

                <label>Password:</label>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && <p className="error">{errors.password}</p>}

                <label>Confirm Password:</label>
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

                <button type="submit">Register</button>
                <p className="login-link">
                    Already have an account? <a href="/login">Login here</a>
                </p>
            </form>

            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Registration Successful!</h2>
                        <button onClick={() => navigate("/login")}>OK</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Register
