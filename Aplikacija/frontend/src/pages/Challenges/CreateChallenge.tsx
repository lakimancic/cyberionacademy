import { useLocation, useNavigate, useParams } from 'react-router-dom';
import InputField from '@/components/Auth/InputField';
import { CircularProgress, FormControlLabel, MenuItem, Select, Slider, Switch } from '@mui/material';
import difficulties from '@/utils/difficulties';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { MdCloudUpload, MdDelete } from 'react-icons/md';
import { FaExternalLinkAlt, FaPlus, FaTrashAlt } from 'react-icons/fa';
import { IoIosSave, IoMdBuild } from 'react-icons/io';
import '@/assets/css/ModCreate.css';
import { useAuth } from '@/contexts/AuthProvider';
import { getInfoFromToken } from '@/lib/jwt';
import * as yup from 'yup';
import * as signalR from '@microsoft/signalr';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface ChallengeData {
    id?: number;
    name: string;
    description: string;
    points: number;
    categoryName: string;
    flag: string;
    difficulty: number;
    isPublic: boolean;
    isArchived: boolean;
    downloadFile?: string;
    dockerFile?: string;
    dockerImage?: string;
};

interface Category {
    name: string;
    shortForm: string;
    id: number;
};

const getColor = (val: number) => {
    if (val < 3) return 'success.main';
    if (val < 7) return 'warning.main';
    return 'error.main';
};

const getColorHex = (val: number) => {
    if (val < 3) return '#66bb6a';
    if (val < 7) return '#ffa726';
    return '#f44336';
};

const pointsValues = [
    { start: 50, step: 10 },
    { start: 100, step: 10 },
    { start: 150, step: 10 },
    { start: 200, step: 20 },
    { start: 300, step: 20 },
    { start: 400, step: 20 },
    { start: 500, step: 20 },
    { start: 600, step: 50 },
    { start: 850, step: 50 },
    { start: 1100, step: 100 }
];

const validationSchema = yup.object({
    categoryName: yup
        .string()
        .required('Category is required'),
    flag: yup
        .string()
        .required('Flag is required')
        .min(5, 'Flag must be at least 3 characters')
        .max(80, 'Flag must be at most 30 characters'),
    description: yup
        .string()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters')
        .max(300, 'Description must be at most 300 characters'),
    name: yup
        .string()
        .required('Name is required')
        .min(3, 'Name must be at least 3 characters')
        .max(30, 'Name must be at most 30 characters'),
});

function CreateChallenge() {
    const params = useParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const downloadFileRef = useRef<HTMLInputElement | null>(null);
    const [downloadFileName, setDownloadFileName] = useState<string|null>(null);
    const dockerFileRef = useRef<HTMLInputElement | null>(null);
    const [dockerFileName, setDockerFileName] = useState<string|null>(null);
    const [challenge, setChallenge] = useState<ChallengeData>({
        name: '',
        description: '',
        points: 50,
        difficulty: 0,
        flag: '',
        categoryName: '',
        isPublic: true,
        isArchived: false,
    });
    const auth = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const dockerLogRef = useRef<HTMLDivElement | null>(null);
    const [dockerLogs, setDockerLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const handleError = useErrorHandler();
    const [error, setError] = useState('');

    const tokenData = getInfoFromToken(auth?.token ?? null);
    
    useEffect(() => {
        api.get('/Categories/')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Greška pri dohvatanju kategorija', err));
    }, []);

    useEffect(() => {
        if(params.id) {
            fetchModChallenge();

            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`${import.meta.env.VITE_BACKEND_URL}/dockerhub`, {
                    accessTokenFactory: () => auth?.token || '',
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            connection.on("LogMessage", (msg : string) => {
                setDockerLogs(prev => [...prev, msg]);
                if(dockerLogRef.current)
                    dockerLogRef.current.scrollTop = dockerLogRef.current?.scrollHeight;
            });

            connection.on("Finish", () => {
                fetchModChallenge();
            });

            connection
                .start()
                .then(() => {
                    connectionRef.current = connection;
                    connection.send("AcceptLogging", parseInt(params.id ?? '0'));
                })
                .catch(err => console.error(err));

            return () => {
                connection.stop();
            };
        }
    }, [location]);

    const fetchModChallenge = () => {
        api.get("/Challenge/ModChallenge", {
            params: { challengeId: params.id }
        })
        .then(resp => {
            setChallenge(resp.data);
        })
        .catch(err => {
            console.error(err);
        })
    };

    const handleInputChange = (value: any, key: keyof ChallengeData) => {
        setChallenge(prev => { return {...prev, [key]: value } });
    };

    const createChallenge = () => {
        setError("");
        setLoading(true);

        validationSchema.validate(challenge)
        .then(() => {
            const formData = new FormData();
            formData.append("Name", challenge.name);
            formData.append("Description", challenge.description);
            formData.append("Points", challenge.points.toString());
            formData.append("Difficulty", challenge.difficulty.toString());
            formData.append("Flag", challenge.flag);
            formData.append("IsPublic", challenge.isPublic.toString());
            formData.append("IsArchived", challenge.isArchived.toString());
            formData.append("CategoryId", (categories.find(c => c.name === challenge.categoryName)?.id ?? 0).toString());

            if (downloadFileRef.current?.files && downloadFileRef.current.files.length > 0)
                formData.append("DownloadFile", downloadFileRef.current.files[0]);

            if (dockerFileRef.current?.files && dockerFileRef.current.files.length > 0)
                formData.append("DockerFile", dockerFileRef.current.files[0]);

            api.post("/Challenge/CreateChallenge", formData)
                .then(resp => {
                    navigate(`/moderator/edit-challenge/${resp.data}`);
                })
                .catch(err => {
                    handleError(err, setError);
                })
                .finally(() => setLoading(false));
        })
        .catch(err => {
            handleError(err, setError);
        })
        .finally(() => setLoading(false));
    };

    const updateChallenge = () => {
        setError("");
        setLoading(true);

        validationSchema.validate(challenge)
        .then(() => {
            const formData = new FormData();
            formData.append("Id", challenge.id?.toString() ?? '');
            formData.append("Name", challenge.name);
            formData.append("Description", challenge.description);
            formData.append("Points", challenge.points.toString());
            formData.append("Difficulty", challenge.difficulty.toString());
            formData.append("Flag", challenge.flag);
            formData.append("IsPublic", challenge.isPublic.toString());
            formData.append("IsArchived", challenge.isArchived.toString());
            formData.append("CategoryId", (categories.find(c => c.name === challenge.categoryName)?.id ?? 0).toString());
            if (!challenge.dockerFile)
                formData.append("DeleteDockerFile", "true");
            if (!challenge.downloadFile)
                formData.append("DeleteDownloadFile", "true");

            if (downloadFileRef.current?.files && downloadFileRef.current.files.length > 0)
                formData.append("DownloadFile", downloadFileRef.current.files[0]);

            if (dockerFileRef.current?.files && dockerFileRef.current.files.length > 0)
                formData.append("DockerFile", dockerFileRef.current.files[0]);

            api.put("/Challenge/UpdateChallenge", formData)
                .then(() => {})
                .catch(err => {
                    handleError(err, setError);
                });
        })
        .catch(err => {
            handleError(err, setError);
        })
        .finally(() => setLoading(false));
    };

    const deleteChallenge = () => {
        api.delete("/Challenge/DeleteChallenge", {
            data: {
                id: challenge.id
            }
        })
        .then(() => {
            navigate("/moderator/challenges");
        })
        .catch(err => {
            console.error(err);
        });
    };

    const buildDocker = () => {
        connectionRef.current?.send("BuildImage", challenge.id);
    };

    const destroyDocker = () => {
        connectionRef.current?.send("DestroyImage", challenge.id);
    };

    const deleteDownloadFile = () => {
        setDownloadFileName(null);
        if(downloadFileRef.current)
            downloadFileRef.current.value = '';
        setChallenge(prev => ({...prev, downloadFile: undefined }));
    };

    const deleteDockerFile = () => {
        setDockerFileName(null);
        if(dockerFileRef.current)
            dockerFileRef.current.value = '';
        setChallenge(prev => ({...prev, dockerFile: undefined }));
    };

    return (
        <div className="studio-create">
            <h1>{params.id ? 'Edit' : 'Create'} Challenge</h1>
            <form className="studio-create-form">
                <h2>
                    Challenge Information
                    {params.id && <a href={`/challenges/${params.id}`} target='_blank' rel='noopener noreferrer'><FaExternalLinkAlt /></a>}
                </h2>
                {error && <div className="studio-error">{error}</div>}
                <div className="studio-create-col">
                    <InputField
                        type='text'
                        label='Name'
                        handleChange={() => {}}
                        inputProps={{
                            value: challenge.name,
                            onChange: e => handleInputChange(e.target.value, 'name')
                        }}
                    />
                    <div className="form-field studio-create-desc">
                        <div className="form-label">Description</div>
                        <textarea
                            className='form-input-normal'
                            spellCheck={false}
                            value={challenge.description}
                            onChange={e => handleInputChange(e.target.value, 'description')}
                        ></textarea>
                    </div>
                    <InputField
                        type='text'
                        label='Flag'
                        handleChange={() => {}}
                        inputProps={{
                            value: challenge.flag,
                            onChange: e => handleInputChange(e.target.value, 'flag')
                        }}
                    />
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Difficulty</div>
                        <Slider
                            value={challenge.difficulty}
                            onChange={(_, val) => {
                                setChallenge(prev => ({
                                    ...prev,
                                    difficulty: val,
                                    points: pointsValues[val].start
                                }))
                            }}
                            aria-label="Difficulty"
                            defaultValue={30}
                            getAriaValueText={val => difficulties[val]}
                            valueLabelFormat={val => difficulties[val]}
                            valueLabelDisplay="auto"
                            shiftStep={3}
                            step={1}
                            marks
                            min={0}
                            max={9}
                            sx={{
                                color: getColor(challenge.difficulty)
                            }}
                        />
                        <div 
                            className="form-value-show"
                            style={{
                                color: getColorHex(challenge.difficulty)
                            }}
                        >{difficulties[challenge.difficulty]}</div>
                    </div>
                    <div className="form-field">
                        <div className="form-label">Points</div>
                        <Slider
                            value={challenge.points}
                            onChange={(_, val) => {
                                setChallenge(prev => ({
                                    ...prev,
                                    points: val
                                }))
                            }}
                            aria-label="Points"
                            defaultValue={50}
                            valueLabelDisplay="auto"
                            shiftStep={pointsValues[challenge.difficulty].step * 3}
                            step={pointsValues[challenge.difficulty].step}
                            marks
                            min={pointsValues[challenge.difficulty].start}
                            max={pointsValues[challenge.difficulty].start + pointsValues[challenge.difficulty].step * 4}
                        />
                        <div className="form-value-show">{challenge.points}pts</div>
                    </div>
                    <div className="studio-create-switches">
                        <div className="studio-create-col form-switch-con">
                            <div className="form-label">Visibility</div>
                            <FormControlLabel control={<Switch 
                                defaultChecked
                                value={challenge.isPublic}
                                onChange={e => handleInputChange(e.target.checked, 'isPublic')}
                            />} label={challenge.isPublic ? 'Public' : 'Private'} />
                        </div>
                        <div className="studio-create-col form-switch-con">
                            <div className="form-label">Status</div>
                            <FormControlLabel control={<Switch 
                                defaultChecked
                                value={!challenge.isArchived}
                                onChange={e => handleInputChange(!e.target.checked, 'isArchived')}
                            />} label={challenge.isArchived ? 'Archived' : 'Active'} />
                        </div>
                    </div>
                    <div className="form-field">
                        <div className="form-label">Category</div>
                        <Select
                            value={challenge.categoryName}
                            displayEmpty
                            onChange={e => handleInputChange(e.target.value, 'categoryName')}
                            renderValue={selected => {
                                if(selected.length === 0)
                                    return <span className='admin-placeholder'>Select Category</span>;

                                return selected;
                            }}
                            >
                                {categories.map((cat, idx) => (<MenuItem key={idx} value={cat.name}>
                                    {cat.name}
                                </MenuItem>))}
                        </Select>
                    </div>
                </div>
                <h2>Upload Information</h2>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Docker Zip File (Containing Dockerfile)</div>
                        <div className="studio-upload-con">
                            <div className='studio-upload-subcon'>
                                <button type="button" onClick={() => dockerFileRef.current?.click()}><MdCloudUpload />  Upload</button>
                                {(!!dockerFileName || !!challenge.dockerFile) && <MdDelete 
                                    onClick={deleteDockerFile} 
                                    className={`studio-upload-remove ${challenge.dockerImage ? 'studio-upload-disabled' : ''}`} />}
                            </div>
                            <p className='studio-no-upload'>
                                {downloadFileName ? `New file: ${dockerFileName}` : (challenge.dockerFile ?? 'No file upload')}
                            </p>
                        </div>
                        <input
                            type="file"
                            ref={dockerFileRef}
                            style={{ display: 'none' }}
                            accept=".zip"
                            onChange={e => {
                                if(e.target.files && e.target.files.length > 0)
                                    setDockerFileName(e.target.files[0].name);
                            }}
                        />
                    </div>
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Challenge Zip File (Available for user)</div>
                        <div className="studio-upload-con">
                            <div className='studio-upload-subcon'>
                                <button type="button" onClick={() => downloadFileRef.current?.click()}><MdCloudUpload />  Upload</button>
                                {(!!downloadFileName || !!challenge.downloadFile) && <MdDelete onClick={deleteDownloadFile} className='studio-upload-remove' />}
                            </div>
                            <p className='studio-no-upload'>
                                {downloadFileName ? `New file: ${downloadFileName}` : (challenge.downloadFile ? `File: ${challenge.downloadFile}` : 'No file upload')}
                            </p>
                        </div>
                        <input
                            type="file"
                            ref={downloadFileRef}
                            style={{ display: 'none' }}
                            accept=".zip"
                            onChange={e => {
                                if(e.target.files && e.target.files.length > 0)
                                    setDownloadFileName(e.target.files[0].name);
                            }}
                        />
                    </div>
                </div>
                <div className="studio-create-buttons">
                    {!loading && <>
                    {!params.id && <button type="button" className='studio-btn-add' onClick={createChallenge}><FaPlus className='studio-icon' /> Create</button>}
                    {params.id && <>
                        <button type="button" className='studio-btn-save' onClick={updateChallenge}><IoIosSave className='studio-icon' /> Save Changes</button>
                        {tokenData?.role === 'Admin' && <button type="button" className='studio-btn-del' onClick={deleteChallenge}><FaTrashAlt className='studio-icon' /> Delete</button>}
                    </>}
                    </>}
                    {loading && <CircularProgress color='inherit' size="1.6rem"/>}
                </div>
            </form>
            {challenge.dockerFile && <div className="studio-create-con">
                <h2>Docker Image Builder</h2>
                <div className="studio-docker-con">
                    <h3>{challenge.dockerImage ?? 'No docker image built'}</h3>
                    <div className="studio-docker-buttons">
                        <button type="button" className='studio-btn-add' disabled={!!challenge.dockerImage} onClick={buildDocker}><IoMdBuild /> Build</button>
                        <button type="button" className='studio-btn-del' disabled={!challenge.dockerImage} onClick={destroyDocker}><FaTrashAlt /> Destroy</button>
                    </div>
                    {!challenge.dockerImage && <><div className="form-label">Docker build Log</div>
                    <div className="studio-docker-logs" ref={dockerLogRef}>
                        {dockerLogs.map((log, ind) => (
                            <div key={ind}>{log}</div>
                        ))}
                    </div></>}
                </div>
            </div>}
        </div>
    )
}

export default CreateChallenge;