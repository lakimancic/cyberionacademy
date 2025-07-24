import { useForm } from 'react-hook-form';
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaArrowRight } from "react-icons/fa";
import { CircularProgress, MenuItem, Select } from '@mui/material';
import InputField from '@/components/Auth/InputField';
import Footer from '@/components/Footer/Footer';
import countries from '@/assets/data/countries.json';
import api from '@/lib/api';
import './Auth.css';

const schema = yup.object({
    email: yup
        .string()
        .required('Email is required')
        .email('The email must be valid'),
    password: yup
        .string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(/[a-z]/, 'Must include at least one lowercase letter')
        .matches(/[A-Z]/, 'Must include at least one uppercase letter')
        .matches(/\d/, 'Must include at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Must include at least one special character'),
    repeatPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords does not match')
        .required('Please confirm your password'),
    username: yup
        .string()
        .required('Username is required')
        .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed')
        .min(3, 'Must be at least 3 characters')
        .max(50, 'Must be at most 50 characters'),
    fullName: yup
        .string()
        .required('Full name is required')
        .matches(
        /^[a-zA-Z]+(?: [a-zA-Z]+)*$/,
        'Only letters and single spaces allowed'
        )
        .min(3, 'Must be at least 3 characters')
        .max(80, 'Must be at most 80 characters'),
    country: yup.string()
});

type FormValues = {
    email: string;
    password: string;
};

type StringFields = 'email' | 'password' | 'repeatPassword' | 'username' | 'fullName';

const errorChecks = [
    { field: 'Email', state: 0 },
    { field: 'Password', state: 1 },
    { field: 'Username', state: 2 },
    { field: 'FullName', state: 2 },
    { field: 'Country', state: 2 },
];

function Register() {
    const {
        register,
        handleSubmit,
        getValues,
        trigger,
        watch,
        clearErrors,
        formState: { errors, isValid }
    } = useForm({
        resolver: yupResolver(schema),
        mode: 'onSubmit'
    });
    const [globalError, setGlobalError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const email = watch('email');
    const password = watch('password');
    const repeatPassword = watch('repeatPassword');
    const [regState, setRegState] = useState(0);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isPassValid, setIsPassValid] = useState(false);

    const handleChange = async (elem : StringFields) => {
        const value = getValues(elem);
        if (value.length > 4) {
            await trigger(elem);
        } else {
            clearErrors(elem);
        }
    };

    const onSubmit = (data: FormValues) => {
        setGlobalError("");
        setLoading(true);

        api.post("/Auth/register", data)
            .then(() => {
                navigate("/login");
            })
            .catch(error => {
                if(error.response) {
                    if(error.response.status === 400) {
                        const data = error.response.data;
                        if('error' in data) {
                            const error : string = data.error;
                            setGlobalError(error);
                            if(error.includes("Email")) {
                                setRegState(0);
                            } else {
                                setRegState(1);
                            }
                        } else if('errors' in data) {
                            for(const check of errorChecks) {
                                if(check.field in data.errors) {
                                    setGlobalError(data.errors[check.field][0]);
                                    setRegState(check.state);
                                    break;
                                }
                            }
                        } else {
                            setGlobalError("Error occured during login");
                        }
                    } else {
                        setGlobalError(error.title);
                    }
                } else {
                    setGlobalError(error.message);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }

    const navigate = useNavigate();

    useEffect(() => {
        async function validateEmail() {
            const valid = await trigger('email');
            setIsEmailValid(valid);
        }

        if (email && email.length > 0) {
            validateEmail();
        } else {
            setIsEmailValid(false);
        }

        async function validatePassword() {
            const valid = await trigger('password');
            const validRepeat = await trigger('repeatPassword');
            setIsPassValid(valid && validRepeat);
        }

        if (password && password.length > 0 && repeatPassword && repeatPassword.length > 0) {
            validatePassword();
        } else {
            setIsPassValid(false);
        }
    }, [password, repeatPassword, email, trigger]);

    return <>
        <h1 className="title">Cyberion<span>Academy</span></h1>
        <button type="button" className="back-button" onClick={() => navigate('/')}>Back</button>
        <form className='auth-form' onSubmit={handleSubmit(onSubmit)}>
            <h1>Create new account</h1>
            {globalError.length > 0 && <div className='auth-global-error'>{globalError}</div>}
            {regState === 0 && <>
                <InputField
                    type='email'
                    label='Email'
                    handleChange={() => handleChange('email')}
                    error={errors.email?.message}
                    inputProps={{...register('email')}}
                />
                <button 
                    type="button"
                    disabled={!isEmailValid}
                    onClick={() => {
                        setRegState(1);
                        setGlobalError("");
                    }}
                >Continue</button>
            </>}
            {regState === 1 && <>
                <InputField
                    type='password'
                    label='Password'
                    handleChange={() => handleChange('password')}
                    error={errors.password?.message}
                    inputProps={{...register('password')}}
                />
                <InputField
                    type='password'
                    label='Repeat password'
                    handleChange={() => handleChange('repeatPassword')}
                    error={errors.repeatPassword?.message}
                    inputProps={{...register('repeatPassword')}}
                />
                <button 
                    type="button"
                    disabled={!isPassValid}
                    onClick={() => {
                        setRegState(2);
                        setGlobalError("");
                    }}
                >Continue</button>
            </>}
            {regState === 2 && <>
                <InputField
                    type='text'
                    label='Username'
                    handleChange={() => handleChange('username')}
                    error={errors.username?.message}
                    inputProps={{...register('username')}}
                />
                <InputField
                    type='text'
                    label='Full name'
                    handleChange={() => handleChange('fullName')}
                    error={errors.fullName?.message}
                    inputProps={{...register('fullName')}}
                />
                <div className="form-field">
                    <div className="form-label">Country</div>
                    <Select
                        displayEmpty
                        defaultValue=""
                        inputProps={{ 'aria-label': 'Country select' }}
                        {...register('country')}
                    >
                        {countries.map((c) => (
                        <MenuItem key={c.code3} value={c.code3}>
                            {c.name}
                        </MenuItem>
                        ))}
                    </Select>
                </div>
                <button 
                    type="submit"
                    disabled={!isValid}
                    className={loading ? 'loading' : ''}
                >{loading ? <CircularProgress color='inherit' size="1.6rem"/> : 'Register'}</button>
            </>}
            <div className="form-next">
                Already have a CyberionAcademy account? <Link to='/login'>Login<FaArrowRight /></Link>
            </div>
        </form>
        <Footer />
    </>
}

export default Register;