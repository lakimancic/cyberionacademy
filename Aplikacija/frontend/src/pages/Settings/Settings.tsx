import { Avatar, CircularProgress, MenuItem, Select } from "@mui/material";
import { MdCloudUpload } from "react-icons/md";
import { BsTrash3Fill } from "react-icons/bs";
import { useEffect, useRef, useState } from "react";
import InputField from "@/components/Auth/InputField";
import countries from "@/assets/data/countries.json";
import Footer from "@/components/Footer/Footer";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import "./Settings.css";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const basicSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("The email must be valid"),
  username: yup
    .string()
    .required("Username is required")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Only letters, numbers, and underscores allowed"
    )
    .min(3, "Must be at least 3 characters")
    .max(50, "Must be at most 50 characters"),
  fullName: yup
    .string()
    .required("Full name is required")
    .matches(
      /^[a-zA-Z]+(?: [a-zA-Z]+)*$/,
      "Only letters and single spaces allowed"
    )
    .min(3, "Must be at least 3 characters")
    .max(80, "Must be at most 80 characters"),
  country: yup.string(),
  bio: yup.string().max(200, "Must be at most 200 characters"),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Must include at least one lowercase letter")
    .matches(/[A-Z]/, "Must include at least one uppercase letter")
    .matches(/\d/, "Must include at least one number")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Must include at least one special character"
    ),
  repeatNewPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords does not match")
    .required("Please confirm your password"),
});

type BasicStringFields = "email" | "username" | "fullName" | "country" | "bio";
type PasswordStringFields =
  | "newPassword"
  | "repeatNewPassword"
  | "currentPassword";

type BasicInfo = {
  username: string;
  email: string;
  fullName: string;
  country?: string;
  bio?: string;
};

type PasswordsInfo = {
  currentPassword: string;
  newPassword: string;
};

function Settings() {
  const basicForm = useForm({
    resolver: yupResolver(basicSchema),
    mode: "onSubmit",
  });
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
    mode: "onSubmit",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [basicError, setBasicError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [origBasic, setOrigBasic] = useState<BasicInfo | undefined>();
  const [basicDiffer, setBasicDiffer] = useState(false);
  const [basicLoading, setBasicLoading] = useState(false);
  const [passwordLoading, setPassowrdLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const country = basicForm.watch("country");
  const handleError = useErrorHandler();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    api
      .post("/Account/ProfilePicture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        window.location.reload();
      })
      .catch((error) => {
        handleError(error, setAvatarError);
      });
  };

  const deleteProfilePicture = () => {
    api
      .delete("/Account/ProfilePicture")
      .then(() => {
        window.location.reload();
      })
      .catch((error) => {
        handleError(error, setAvatarError);
      });
  };

  const handleBasicChange = async (elem: BasicStringFields) => {
    const value = basicForm.getValues(elem);
    if (value && value.length > 4) {
      await basicForm.trigger(elem);
    } else {
      basicForm.clearErrors(elem);
    }
    setBasicDiffer(isBasicDiffer(basicForm.getValues()));
  };

  const handlePasswordChange = async (elem: PasswordStringFields) => {
    const value = passwordForm.getValues(elem);
    if (value && value.length > 4) {
      await passwordForm.trigger(elem);
    } else {
      passwordForm.clearErrors(elem);
    }
  };

  const isBasicDiffer = (values: BasicInfo) => {
    return (
      origBasic?.username !== values.username ||
      origBasic?.email !== values.username ||
      origBasic?.fullName !== values.fullName ||
      origBasic?.country !== values.country ||
      origBasic?.bio !== values.bio
    );
  };

  const onSubmitBasic = (values: BasicInfo) => {
    if (values.country === null || values.country?.length == 0)
      delete values.country;

    if (values.bio && values.bio.length === 0) delete values.bio;

    if (!isBasicDiffer(values)) return;

    setBasicLoading(true);
    setBasicError("");

    api
      .put("/Account/ChangeInfo", values)
      .then(() => {
        setOrigBasic(values);
        setBasicDiffer(false);
      })
      .catch((error) => {
        handleError(error, setBasicError);
      })
      .finally(() => {
        setBasicLoading(false);
      });
  };

  const onSubmitPassword = (values: PasswordsInfo) => {
    setPassowrdLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    api
      .put("/Account/ChangePassword", values)
      .then(() => {
        setPasswordSuccess("Password changed successfully");

        passwordForm.reset();
      })
      .catch((error) => {
        handleError(error, setPasswordError);
      })
      .finally(() => {
        setPassowrdLoading(false);
      });
  };

  useEffect(() => {
    api
      .get("/Account/GetInfo")
      .then((resp) => {
        setBasicDiffer(false);
        setOrigBasic(resp.data);
        basicForm.setValue("email", resp.data.email);
        basicForm.setValue("username", resp.data.username);
        basicForm.setValue("fullName", resp.data.fullName);
        basicForm.setValue("bio", resp.data.bio);
        if (resp.data.country) basicForm.setValue("country", resp.data.country);
      })
      .catch((error) => {
        handleError(error, setBasicError);
      });

    api
      .get("/Account/ProfilePicture", {
        responseType: "blob",
      })
      .then((resp) => {
        const url = URL.createObjectURL(resp.data);
        setAvatarUrl(url);
      });
  }, []);

  return (
    <div className="settings">
      <h1>User Account Settings</h1>
      <div className="settings-avatar">
        <div className="settings-avatar-info">
          <Avatar src={avatarUrl}></Avatar>
          <div className="settings-avatar-text">
            <h2>Upload your Avatar</h2>
            <p>The maximum size of an image is 2MB.</p>
            <p>We support .png .jpg .jpeg.</p>
            <p className="settings-avatar-error">{avatarError}</p>
          </div>
        </div>
        <div className="settings-avatar-buttons">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="settings-avatar-upload"
          >
            <MdCloudUpload />
            Upload avatar
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".jpg,.png,.jpeg"
              onChange={handleFileChange}
            />
          </button>
          <button
            type="button"
            className="settings-avatar-delete"
            onClick={deleteProfilePicture}
          >
            <BsTrash3Fill />
          </button>
        </div>
      </div>
      <form
        className="settings-form settings-basic"
        onSubmit={basicForm.handleSubmit(onSubmitBasic)}
      >
        <h2>Basic Information</h2>
        <p className="settings-error">{basicError}</p>
        <InputField
          type="text"
          label="Username"
          handleChange={() => handleBasicChange("username")}
          error={basicForm.formState.errors.username?.message}
          inputProps={{ ...basicForm.register("username") }}
        />
        <InputField
          type="email"
          label="Email"
          handleChange={() => handleBasicChange("email")}
          error={basicForm.formState.errors.email?.message}
          inputProps={{ ...basicForm.register("email") }}
        />
        <InputField
          type="text"
          label="Full name"
          handleChange={() => handleBasicChange("fullName")}
          error={basicForm.formState.errors.fullName?.message}
          inputProps={{ ...basicForm.register("fullName") }}
        />
        <div className="form-field">
          <div className="form-label">Country</div>
          <Select
            value={country || ""}
            displayEmpty
            defaultValue=""
            inputProps={{ "aria-label": "Country select" }}
            {...basicForm.register("country")}
            onChange={(event) => {
              basicForm.trigger();
              setBasicDiffer(
                isBasicDiffer({
                  ...basicForm.getValues(),
                  country: event.target.value,
                })
              );
            }}
          >
            {countries.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="form-field settings-bio">
          <div className="form-label">Bio</div>
          <textarea
            className={
              basicForm.formState.errors.bio
                ? "form-input-error"
                : "form-input-normal"
            }
            spellCheck={false}
            onKeyUp={() => handleBasicChange("bio")}
            {...basicForm.register("bio")}
          ></textarea>
          <div
            className={`form-error ${
              basicForm.formState.errors.bio ? "" : "form-hidden"
            }`}
          >
            {basicForm.formState.errors.bio?.message ?? ""}
          </div>
        </div>
        <button
          type="submit"
          disabled={!basicForm.formState.isValid || !basicDiffer}
          className={basicLoading ? "loading" : ""}
        >
          {basicLoading ? (
            <CircularProgress color="inherit" size="1.6rem" />
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
      <form
        className="settings-form settings-sec"
        onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
      >
        <h2>Security Information</h2>
        <p
          className={`settings-error ${
            passwordSuccess.length > 0 ? "settings-success" : ""
          }`}
        >
          {passwordSuccess.length > 0 ? passwordSuccess : passwordError}
        </p>
        <InputField
          type="password"
          label="Current Password"
          handleChange={() => handlePasswordChange("currentPassword")}
          error={passwordForm.formState.errors.currentPassword?.message}
          inputProps={{ ...passwordForm.register("currentPassword") }}
        />
        <div className="settings-break"></div>
        <InputField
          type="password"
          label="New Password"
          handleChange={() => handlePasswordChange("newPassword")}
          error={passwordForm.formState.errors.newPassword?.message}
          inputProps={{ ...passwordForm.register("newPassword") }}
        />
        <InputField
          type="password"
          label="Confirm new password"
          handleChange={() => handlePasswordChange("repeatNewPassword")}
          error={passwordForm.formState.errors.repeatNewPassword?.message}
          inputProps={{
            onPaste: (e) => e.preventDefault(),
            onCopy: (e) => e.preventDefault(),
            onCut: (e) => e.preventDefault(),
            ...passwordForm.register("repeatNewPassword"),
          }}
        />
        <button
          type="submit"
          disabled={!passwordForm.formState.isValid}
          className={passwordLoading ? "loading" : ""}
        >
          {passwordLoading ? (
            <CircularProgress color="inherit" size="1.6rem" />
          ) : (
            "Update Password"
          )}
        </button>
      </form>
      <Footer />
    </div>
  );
}

export default Settings;
