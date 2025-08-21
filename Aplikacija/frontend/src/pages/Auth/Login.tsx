import { useForm } from 'react-hook-form';
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import InputField from '@/components/Auth/InputField';
import Footer from '@/components/Footer/Footer';
import './Auth.css';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthProvider';
import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { IoMdArrowRoundBack } from 'react-icons/io';

const schema = yup.object({
    email: yup
        .string()
        .required('Email is required')
        .email('The email must be valid'),
    password: yup
        .string()
        .required('Password is required')
});

type FormValues = {
    email: string;
    password: string;
};

function Login() {
    const {
        register,
        handleSubmit,
        getValues,
        trigger,
        clearErrors,
        formState: { errors, isValid }
    } = useForm({
        resolver: yupResolver(schema),
        mode: 'onSubmit'
    });
    const auth = useAuth();
    const [globalError, setGlobalError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleChange = async (elem : 'email' | 'password') => {
        const value = getValues(elem);
        if (value.length > 4) {
            await trigger(elem);
        } else {
            clearErrors(elem);
        }
    };

    const navigate = useNavigate();

    const onSubmit = (data: FormValues) => {
        setGlobalError("");
        setLoading(true);

        api.post("/Auth/Login", data)
            .then(response => {
                auth?.setToken(response.data.accessToken);
                auth?.setRefreshToken(response.data.refreshToken);

                navigate("/");
            })
            .catch(error => {
                if(error.response) {
                    if(error.response.status === 400) {
                        const data = error.response.data;
                        if('error' in data) {
                            setGlobalError(data.error);
                        } else {
                            setGlobalError("Error occured during login");
                        }
                    } else if('title' in error) {
                        setGlobalError(error.title);
                    } else {
                        setGlobalError(error.message);
                    }
                } else {
                    setGlobalError(error.message);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return <>
        <h1 className="title">Cyberion<span>Academy</span></h1>
        <button type="button" className="back-button" onClick={() => navigate('/')}><IoMdArrowRoundBack /></button>
        <form className='auth-form' onSubmit={handleSubmit(onSubmit)}>
            <h1>Log in to your account</h1>
            {globalError.length > 0 && <div className='auth-global-error'>{globalError}</div>}
            <InputField
                type='email'
                label='Email'
                handleChange={() => handleChange('email')}
                error={errors.email?.message}
                inputProps={{...register('email')}}
            />
            <InputField
                type='password'
                label='Password'
                handleChange={() => handleChange('password')}
                error={errors.password?.message}
                inputProps={{...register('password')}}
            />
            <button 
                type="submit"
                disabled={!isValid}
                className={loading ? 'loading' : ''}
            >{loading ? <CircularProgress color='inherit' size="1.6rem"/> : 'Log in'}</button>
            <div className="form-next">
                New to CyberionAcademy? <Link to='/register'>Register account <FaArrowRight /></Link>
            </div>
        </form>
        <Footer />
    </>
}

export default Login;