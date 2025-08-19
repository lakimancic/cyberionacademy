import Radio from '@mui/material/Radio';
import './RoleSignup.css';
import { useEffect, useState } from 'react';
import { FormControlLabel, RadioGroup } from '@mui/material';
import { GrUserAdmin } from "react-icons/gr";
import { FaRegClock } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthProvider';
import { getInfoFromToken } from '@/lib/jwt';
import * as yup from 'yup';
import api from '@/lib/api';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { useErrorHandler } from '@/hooks/useErrorHandler';

type RoleRequestInfo = {
    requestedAt: Date;
    role: string;
    status: string;
};

type RoleRequest = {
    text: string;
    role: string;
};

const schema = yup.object({
    text: yup
        .string()
        .required("Request letter is required")
        .min(50, 'Must be at least 3 characters')
        .max(300, 'Must be at most 50 characters'),
    role: yup
        .string()
        .required('Role is not selected')
});

function RoleSignup() {
    const [tab, setTab] = useState(0);
    const [cooldown, setCooldown] = useState(false);
    const [requests, setRequests] = useState<RoleRequestInfo[]>([]);
    const [globalError, setGlobalError] = useState("");
    const { control, handleSubmit, register, formState: { isValid }} = useForm({
        resolver: yupResolver(schema),
        mode: 'onSubmit'
    });
    const auth = useAuth();
    const handleError = useErrorHandler();
    
    const tokenData = getInfoFromToken(auth?.token ?? null);
    const roleInd = ['User', 'Helper', 'Moderator', 'Admin'].indexOf(tokenData?.role ?? 'User');

    const onSubmit = (data: RoleRequest) => {
        if(!isValid) return;

        setGlobalError("");

        api.post("/Roles/SubmitRoleRequest", data)
            .then(() => {
                updateData();
            })
            .catch(err => {
                handleError(err, setGlobalError);
            });
    };

    const updateData = () => {
        api.get("/Roles/GetRoleRequests")
            .then(resp => {
                setRequests(resp.data.requests.map((req : any) => {
                    return {...req, requestedAt: new Date(req.requestedAt)}
                }));
                setCooldown(!resp.data.canSubmit);
            })
            .catch(err => {
                handleError(err, setGlobalError);
            });
    }

    useEffect(() => {
        updateData();
    }, []);

    return (
        <div className="role-signup">
            <h1>Role Sign-Up</h1>
            <h2 className="role-signup-current">
                Current role: <span className={`role-signup-role role-${tokenData?.role.toLocaleLowerCase()}`}>{tokenData?.role}</span>
            </h2>
            <div className="role-signup-tabs">
                <div className="role-signup-tab" onClick={() => setTab(0)}>
                    Sign-Up Form
                </div>
                <div className="role-signup-tab" onClick={() => setTab(1)}>
                    Submitted Requests
                </div>
                <div className={`role-signup-active-${tab === 0 ? 'first' : 'second'}`}></div>
            </div>
            <div className="role-signup-content">
                {tab === 0 && cooldown && <div className="role-signup-cooldown">
                    <FaRegClock />
                    <h2>You can only submit request once a month!</h2>
                </div>}
                {tab === 0 && tokenData?.role === 'Admin' && <div className="role-signup-admin">
                    <GrUserAdmin />
                    <h2>You are already Administrator!</h2>
                </div>}
                {tab === 0 && !cooldown && tokenData?.role !== 'Admin' && <form className="role-signup-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="role-error">{globalError}</div>
                    <div className="role-signup-roleradios">
                        <span className="role-signup-label">Select role: </span>
                        <Controller
                            name="role"
                            control={control}
                            defaultValue=''
                            render={({field}) => (
                                <RadioGroup row {...field}>
                                    {roleInd < 1 && <FormControlLabel value="Helper" control={<Radio className='role-radio-helper' />} label="Helper" />}
                                    {roleInd < 2 && <FormControlLabel value="Moderator" control={<Radio className='role-radio-moderator' />} label="Moderator" />}
                                    {roleInd < 3 && <FormControlLabel value="Admin" control={<Radio className='role-radio-admin' />} label="Administrator" />}
                                </RadioGroup>
                            )}
                        />
                    </div>
                    <p className="role-signup-label">Request letter (min 50 characters): </p>
                    <textarea
                        {...register('text')}
                    ></textarea>
                    <button 
                        type="submit"
                        disabled={!isValid}
                    >Submit request</button>
                </form>}
                {tab === 1 && <div className="role-signup-requests">
                    {requests.map((req, ind) => (<div key={ind} className="role-signup-request">
                        <div className='role-request-reqinfo'>
                            <div className="role-request-role">For <span className={`role-${req.role.toLocaleLowerCase()}`}>{req.role}</span></div>
                            <div className="role-request-date">Submitted at: <span>{req.requestedAt.toDateString()}</span></div>
                        </div>
                        <div className="role-request-status">Status: <span className={`role-${req.status.toLocaleLowerCase()}`}>{req.status}</span></div>
                    </div>))}
                </div>}
            </div>
        </div>
    )
}

export default RoleSignup;