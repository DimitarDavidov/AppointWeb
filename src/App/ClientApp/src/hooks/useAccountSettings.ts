import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  changePassword,
  deleteAccount,
  getAccountProfile,
  updateEmail,
  updatePhoneNumber,
  updateUsername,
} from "../api/account";
import { getErrorMessage } from "../api/errors";
import { setCredentials, logout } from "../features/auth/authSlice";
import { useAsyncData } from "./useAsyncData";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export type EditableField = "email" | "username" | "password" | "phoneNumber";

export function useAccountSettings() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { email, username, role } = useAppSelector((state) => state.auth);

  const [phoneNumber, setPhoneNumber] = useState("");
  const { isLoading, error: loadError } = useAsyncData(getAccountProfile, [], {
    onSuccess: (profile) => setPhoneNumber(profile.phoneNumber ?? ""),
    errorMessage: "Failed to load account details.",
  });

  const [draftValue, setDraftValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function startEditing(field: EditableField) {
    setEditingField(field);
    setError("");
    setMessage("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    if (field === "email") setDraftValue(email ?? "");
    else if (field === "username") setDraftValue(username ?? "");
    else if (field === "phoneNumber") setDraftValue(phoneNumber);
  }

  function cancelEditing() {
    setEditingField(null);
    setDraftValue("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function handleSaveEmail(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    setIsSavingEmail(true);
    setError("");

    try {
      const response = await updateEmail(trimmed);
      dispatch(setCredentials(response));
      setEditingField(null);
      setMessage("Email updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update email."));
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function handleSaveUsername(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setIsSavingUsername(true);
    setError("");

    try {
      const response = await updateUsername(trimmed);
      dispatch(setCredentials(response));
      setEditingField(null);
      setMessage("Username updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update username."));
    } finally {
      setIsSavingUsername(false);
    }
  }

  async function handleSavePassword(e: FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    setError("");

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditingField(null);
      setMessage("Password updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update password."));
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSavePhone(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    setIsSavingPhone(true);
    setError("");

    try {
      const profile = await updatePhoneNumber(trimmed);
      setPhoneNumber(profile.phoneNumber ?? "");
      setEditingField(null);
      setMessage("Phone number updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update phone number."));
    } finally {
      setIsSavingPhone(false);
    }
  }

  function openDeleteDialog() {
    setDeletePassword("");
    setDeleteError("");
    setShowDeleteDialog(true);
  }

  function closeDeleteDialog() {
    if (isDeletingAccount) return;
    setShowDeleteDialog(false);
    setDeletePassword("");
    setDeleteError("");
  }

  async function confirmDeleteAccount() {
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm account deletion.");
      return;
    }

    setDeleteError("");
    setIsDeletingAccount(true);

    try {
      await deleteAccount(deletePassword);
      dispatch(logout());
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(
        getErrorMessage(err, "Could not delete your account. Please try again.")
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return {
    email,
    username,
    role,
    phoneNumber,
    isLoading,
    loadError,
    draftValue,
    setDraftValue,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    message,
    isSavingEmail,
    isSavingUsername,
    isSavingPassword,
    isSavingPhone,
    showDeleteDialog,
    deletePassword,
    setDeletePassword,
    deleteError,
    isDeletingAccount,
    editingField,
    startEditing,
    cancelEditing,
    handleSaveEmail,
    handleSaveUsername,
    handleSavePassword,
    handleSavePhone,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteAccount,
  };
}
