import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    terms: boolean;
};

export const RegisterScreen = () => {
    const {register: doRegister, loading} = useAuth();

    const {
        control,
        handleSubmit,
        watch,
        setError,
        formState: {errors, isValid},
    } = useForm<FormData>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
            terms: false,
        },
        mode: "onChange",
    });

    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    const onSubmit = async (data: FormData) => { 
        try {
            // data.firstName, data.lastName de trimis la backend cand e gata
            await doRegister(data.email, data.password);
        } catch (error: any) {
            const msg = error?.message || "Registration failed. Please try again.";
        }
    }

    const pwd = watch("password");  
    
    return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={{flex: 1, padding: 20, gap: 14, justifyContent: 'center'}}>
          <Text style={{fontSize: 28, fontWeight: '700', marginBottom: 4}}>Create account</Text>
          <Text style={{opacity: 0.7, marginBottom: 20}}>It only takes a minute.</Text>

          {/* Email */}
          <Text style={{fontWeight: '600'}}>Email</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email'},
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  accessibilityLabel="Email address"
                />
                {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
              </>
            )}
          />

          {/* Password */}
          <Text style={{fontWeight: '600'}}>Password</Text>
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: {value: 8, message: 'Use at least 8 characters'},
              validate: (v) =>
                /[0-9]/.test(v) && /[A-Za-z]/.test(v) || 'Add letters and numbers',
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <>
                <View style={{position: 'relative'}}>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPwd}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPwd((s) => !s)}
                    style={styles.eye}
                    accessibilityRole="button"
                    accessibilityLabel={showPwd ? 'Hide password' : 'Show password'}>
                    <Text>{showPwd ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
              </>
            )}
          />

          {/* Confirm password */}
          <Text style={{fontWeight: '600'}}>Confirm password</Text>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (v) => v === pwd || 'Passwords do not match',
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <>
                <View style={{position: 'relative'}}>
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPwd}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    accessibilityLabel="Confirm password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPwd((s) => !s)}
                    style={styles.eye}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPwd ? 'Hide confirmation' : 'Show confirmation'}>
                    <Text>{showConfirmPwd ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}
              </>
            )}
          />

          {/* Terms checkbox (simple tap target) */}
          <Controller
            control={control}
            name="terms"
            rules={{validate: (v) => v || 'You must accept the terms'}}
            render={({field: {value, onChange}}) => (
              <>
                <TouchableOpacity
                  onPress={() => onChange(!value)}
                  style={styles.checkboxRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: value}}>
                  <View style={[styles.checkboxBox, value && styles.checkboxBoxChecked]}>
                    {value && <Text>✓</Text>}
                  </View>
                  <Text style={{flex: 1}}>
                    I agree to the <Text style={{textDecorationLine: 'underline'}}>Terms</Text> and{' '}
                    <Text style={{textDecorationLine: 'underline'}}>Privacy Policy</Text>.
                  </Text>
                </TouchableOpacity>
                {errors.terms && <Text style={styles.error}>{errors.terms.message}</Text>}
              </>
            )}
          />

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || loading}
            style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
            accessibilityRole="button">
            {loading ? <ActivityIndicator /> : <Text >Create account</Text>}
          </TouchableOpacity>

          {/* Link to Login */}
          <Text style={{textAlign: 'center', marginTop: 10}}>
            Already have an account? <Text style={{textDecorationLine: 'underline'}}>Sign in</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    padding: 12,
    borderRadius: 10,
  },
  error: {
    color: '#D92D20',
    marginTop: 4,
  },
  eye: {
    position: 'absolute' as const,
    right: 12,
    top: 12,
    padding: 4,
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginTop: 8,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxBoxChecked: {
    backgroundColor: '#E6F4FF',
    borderColor: '#8EC9FF',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
};