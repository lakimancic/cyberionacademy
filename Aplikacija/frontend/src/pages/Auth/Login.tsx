import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import InputField from '../../components/Auth/InputField';
import Footer from '../../components/Footer/Footer';
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
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Must include at least one special character')
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

    const handleChange = async (elem : 'email' | 'password') => {
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

    return <>
        <h1 className="title">Cyberion<span>Academy</span></h1>
        <form className='auth-form' onSubmit={handleSubmit(onSubmit)}>
            <h1>Log in to your account</h1>
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
            >Log in</button>
            <div className="form-next">
                New to CyberionAcademy? <Link to='/register'>Register account <FaArrowRight /></Link>
            </div>
        </form>
        <Footer />
    </>
}

export default Login;