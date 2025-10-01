
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

type FormData = { email: string; password: string };

export default function LoginScreen() {
  const {control, handleSubmit} = useForm<FormData>({defaultValues: {email: '', password: ''}});
  const {login, loading} = useAuth();

  const onSubmit = (data: FormData) => login(data.email, data.password);

  return (
    <View style={{padding: 16, gap: 12}}>
      <Text>Email</Text>
      <Controller
        control={control}
        name="email"
        rules={{required: 'Email is required'}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{borderWidth: 1, padding: 10, borderRadius: 8}}
            />
            {error && <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />

      <Text>Password</Text>
      <Controller
        control={control}
        name="password"
        rules={{required: 'Password is required', minLength: {value: 6, message: 'Min 6 chars'}}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              value={value}
              onChangeText={onChange}
              secureTextEntry
              style={{borderWidth: 1, padding: 10, borderRadius: 8}}
            />
            {error && <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />

      <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
