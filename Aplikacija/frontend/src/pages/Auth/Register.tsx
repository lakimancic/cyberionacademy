import { useForm } from 'react-hook-form';
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import InputField from '../../components/Auth/InputField';
import Footer from '../../components/Footer/Footer';
import { useEffect, useState } from 'react';
import countries from '../../assets/data/countries.json';
import { MenuItem, Select } from '@mui/material';
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
        console.log(data);
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
                    onClick={() => setRegState(1)}
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
                    onClick={() => setRegState(2)}
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
                >Register</button>
            </>}
            <div className="form-next">
                Already have a CyberionAcademy account? <Link to='/login'>Login<FaArrowRight /></Link>
            </div>
        </form>
        <Footer />
    </>
}

export default Register;