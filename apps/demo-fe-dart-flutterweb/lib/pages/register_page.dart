import 'dart:js_interop';

import 'package:dio/dio.dart';
import 'package:web/web.dart';

import '../models/auth.dart';
import '../services/auth_service.dart' as auth_svc;
import '../services/api_client.dart';
import '../main.dart' as router;

void render(Element parent) {
  // If already authenticated, redirect
  if (getAccessToken() != null) {
    router.navigateTo('/expenses');
    return;
  }

  final main = document.createElement('main') as HTMLElement;
  main.style.setProperty('max-width', '28rem');
  main.style.setProperty('margin', '4rem auto');
  main.style.setProperty('padding', '2rem');

  final h1 = document.createElement('h1') as HTMLHeadingElement;
  h1.textContent = 'Create Account';
  h1.style.setProperty('margin-bottom', '1.5rem');
  main.appendChild(h1);

  // Form-level error container
  final errorDiv = document.createElement('div') as HTMLDivElement;
  errorDiv.id = 'register-error';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.style.setProperty('display', 'none');
  errorDiv.style.setProperty('background-color', '#fdf2f2');
  errorDiv.style.setProperty('color', '#c0392b');
  errorDiv.style.setProperty('padding', '0.75rem 1rem');
  errorDiv.style.setProperty('border-radius', '4px');
  errorDiv.style.setProperty('margin-bottom', '1rem');
  errorDiv.style.setProperty('border', '1px solid #f5c6cb');
  main.appendChild(errorDiv);

  final form = document.createElement('form') as HTMLFormElement;
  form.setAttribute('novalidate', '');
  form.style.setProperty('background-color', '#ffffff');
  form.style.setProperty('padding', '2rem');
  form.style.setProperty('border-radius', '8px');
  form.style.setProperty('border', '1px solid #ddd');
  form.style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.08)');

  // Username field
  final usernameGroup = document.createElement('div') as HTMLDivElement;
  usernameGroup.style.setProperty('margin-bottom', '1.25rem');

  final usernameLabel = document.createElement('label') as HTMLLabelElement;
  usernameLabel.htmlFor = 'username';
  usernameLabel.textContent = 'Username';
  usernameLabel.style.setProperty('display', 'block');
  usernameLabel.style.setProperty('margin-bottom', '0.4rem');
  usernameLabel.style.setProperty('font-weight', '600');
  usernameGroup.appendChild(usernameLabel);

  final usernameInput = document.createElement('input') as HTMLInputElement;
  usernameInput.id = 'username';
  usernameInput.type = 'text';
  usernameInput.autocomplete = 'username';
  usernameInput.setAttribute('aria-required', 'true');
  usernameInput.style.setProperty('width', '100%');
  usernameInput.style.setProperty('padding', '0.75rem 0.75rem');
  usernameInput.style.setProperty('border', '1px solid #ccc');
  usernameInput.style.setProperty('border-radius', '4px');
  usernameInput.style.setProperty('font-size', '1rem');
  usernameInput.style.setProperty('box-sizing', 'border-box');
  usernameGroup.appendChild(usernameInput);

  final usernameError = document.createElement('span') as HTMLSpanElement;
  usernameError.id = 'username-error';
  usernameError.setAttribute('role', 'alert');
  usernameError.style.setProperty('display', 'none');
  usernameError.style.setProperty('color', '#c0392b');
  usernameError.style.setProperty('font-size', '0.85rem');
  usernameError.style.setProperty('margin-top', '0.25rem');
  usernameGroup.appendChild(usernameError);
  form.appendChild(usernameGroup);

  // Email field
  final emailGroup = document.createElement('div') as HTMLDivElement;
  emailGroup.style.setProperty('margin-bottom', '1.25rem');

  final emailLabel = document.createElement('label') as HTMLLabelElement;
  emailLabel.htmlFor = 'email';
  emailLabel.textContent = 'Email';
  emailLabel.style.setProperty('display', 'block');
  emailLabel.style.setProperty('margin-bottom', '0.4rem');
  emailLabel.style.setProperty('font-weight', '600');
  emailGroup.appendChild(emailLabel);

  final emailInput = document.createElement('input') as HTMLInputElement;
  emailInput.id = 'email';
  emailInput.type = 'email';
  emailInput.autocomplete = 'email';
  emailInput.setAttribute('aria-required', 'true');
  emailInput.style.setProperty('width', '100%');
  emailInput.style.setProperty('padding', '0.75rem 0.75rem');
  emailInput.style.setProperty('border', '1px solid #ccc');
  emailInput.style.setProperty('border-radius', '4px');
  emailInput.style.setProperty('font-size', '1rem');
  emailInput.style.setProperty('box-sizing', 'border-box');
  emailGroup.appendChild(emailInput);

  final emailError = document.createElement('span') as HTMLSpanElement;
  emailError.id = 'email-error';
  emailError.setAttribute('role', 'alert');
  emailError.style.setProperty('display', 'none');
  emailError.style.setProperty('color', '#c0392b');
  emailError.style.setProperty('font-size', '0.85rem');
  emailError.style.setProperty('margin-top', '0.25rem');
  emailGroup.appendChild(emailError);
  form.appendChild(emailGroup);

  // Password field
  final passwordGroup = document.createElement('div') as HTMLDivElement;
  passwordGroup.style.setProperty('margin-bottom', '1.5rem');

  final passwordLabel = document.createElement('label') as HTMLLabelElement;
  passwordLabel.htmlFor = 'password';
  passwordLabel.textContent = 'Password';
  passwordLabel.style.setProperty('display', 'block');
  passwordLabel.style.setProperty('margin-bottom', '0.4rem');
  passwordLabel.style.setProperty('font-weight', '600');
  passwordGroup.appendChild(passwordLabel);

  final passwordInput = document.createElement('input') as HTMLInputElement;
  passwordInput.id = 'password';
  passwordInput.type = 'password';
  passwordInput.autocomplete = 'new-password';
  passwordInput.setAttribute('aria-required', 'true');
  passwordInput.style.setProperty('width', '100%');
  passwordInput.style.setProperty('padding', '0.6rem 0.75rem');
  passwordInput.style.setProperty('border', '1px solid #ccc');
  passwordInput.style.setProperty('border-radius', '4px');
  passwordInput.style.setProperty('font-size', '1rem');
  passwordInput.style.setProperty('box-sizing', 'border-box');
  passwordGroup.appendChild(passwordInput);

  final passwordHint = document.createElement('p') as HTMLParagraphElement;
  passwordHint.textContent = 'Min 12 chars, 1 uppercase, 1 special character';
  passwordHint.style.setProperty('font-size', '0.8rem');
  passwordHint.style.setProperty('color', '#666');
  passwordHint.style.setProperty('margin-top', '0.3rem');
  passwordHint.style.setProperty('margin-bottom', '0');
  passwordGroup.appendChild(passwordHint);

  final passwordError = document.createElement('span') as HTMLSpanElement;
  passwordError.id = 'password-error';
  passwordError.setAttribute('role', 'alert');
  passwordError.style.setProperty('display', 'none');
  passwordError.style.setProperty('color', '#c0392b');
  passwordError.style.setProperty('font-size', '0.85rem');
  passwordError.style.setProperty('margin-top', '0.25rem');
  passwordGroup.appendChild(passwordError);
  form.appendChild(passwordGroup);

  // Submit button
  final submitBtn = document.createElement('button') as HTMLButtonElement;
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Create Account';
  submitBtn.style.setProperty('width', '100%');
  submitBtn.style.setProperty('padding', '0.75rem');
  submitBtn.style.setProperty('background-color', '#1a73e8');
  submitBtn.style.setProperty('color', '#ffffff');
  submitBtn.style.setProperty('border', 'none');
  submitBtn.style.setProperty('border-radius', '4px');
  submitBtn.style.setProperty('font-size', '1rem');
  submitBtn.style.setProperty('cursor', 'pointer');
  submitBtn.style.setProperty('font-weight', '600');
  form.appendChild(submitBtn);

  form.addEventListener(
    'submit',
    ((Event e) {
      e.preventDefault();

      // Clear all errors
      errorDiv.style.setProperty('display', 'none');
      usernameError.style.setProperty('display', 'none');
      emailError.style.setProperty('display', 'none');
      passwordError.style.setProperty('display', 'none');
      usernameInput.setAttribute('aria-invalid', 'false');
      emailInput.setAttribute('aria-invalid', 'false');
      passwordInput.setAttribute('aria-invalid', 'false');

      final username = usernameInput.value.trim();
      final email = emailInput.value.trim();
      final password = passwordInput.value;

      var valid = true;

      if (username.isEmpty) {
        usernameError.textContent = 'Username is required';
        usernameError.style.setProperty('display', 'block');
        usernameInput.setAttribute('aria-invalid', 'true');
        usernameInput.setAttribute('aria-describedby', 'username-error');
        valid = false;
      }

      final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
      if (email.isEmpty) {
        emailError.textContent = 'Email is required';
        emailError.style.setProperty('display', 'block');
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.setAttribute('aria-describedby', 'email-error');
        valid = false;
      } else if (!emailRegex.hasMatch(email)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.style.setProperty('display', 'block');
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.setAttribute('aria-describedby', 'email-error');
        valid = false;
      }

      if (password.isEmpty) {
        passwordError.textContent = 'Password is required';
        passwordError.style.setProperty('display', 'block');
        passwordInput.setAttribute('aria-invalid', 'true');
        passwordInput.setAttribute('aria-describedby', 'password-error');
        valid = false;
      } else {
        final hints = <String>[];
        if (password.length < 12) hints.add('at least 12 characters');
        if (!RegExp(r'[A-Z]').hasMatch(password)) hints.add('1 uppercase letter');
        if (!RegExp(r'[^a-zA-Z0-9]').hasMatch(password)) {
          hints.add('1 special character');
        }
        if (hints.isNotEmpty) {
          passwordError.textContent = 'Password must contain: ${hints.join(', ')}';
          passwordError.style.setProperty('display', 'block');
          passwordInput.setAttribute('aria-invalid', 'true');
          passwordInput.setAttribute('aria-describedby', 'password-error');
          valid = false;
        }
      }

      if (!valid) return;

      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;
      submitBtn.style.setProperty('cursor', 'not-allowed');

      () async {
        try {
          await auth_svc.register(
            RegisterRequest(username: username, email: email, password: password),
          );
          router.navigateTo('/login?registered=true');
        } on DioException catch (err) {
          submitBtn.textContent = 'Create Account';
          submitBtn.disabled = false;
          submitBtn.style.setProperty('cursor', 'pointer');

          final status = err.response?.statusCode;

          String errorMsg;
          if (status == 409) {
            errorMsg = 'Username or email already exists.';
          } else if (status == 400) {
            errorMsg = 'Invalid registration data. Check your inputs.';
          } else {
            errorMsg = 'Registration failed. Please try again.';
          }

          errorDiv.textContent = errorMsg;
          errorDiv.style.setProperty('display', 'block');
        }
      }();
    }).toJS,
  );

  main.append(form);

  final loginLink = document.createElement('p') as HTMLParagraphElement;
  loginLink.style.setProperty('margin-top', '1rem');
  loginLink.style.setProperty('text-align', 'center');
  loginLink.style.setProperty('color', '#666');
  loginLink.append(
    document.createTextNode('Already have an account? ') as Node,
  );

  final logA = document.createElement('a') as HTMLAnchorElement;
  logA.href = '/login';
  logA.style.setProperty('color', '#1a73e8');
  logA.textContent = 'Log in';
  logA.addEventListener(
    'click',
    ((Event e) {
      e.preventDefault();
      router.navigateTo('/login');
    }).toJS,
  );
  loginLink.appendChild(logA);
  main.appendChild(loginLink);

  parent.appendChild(main);
}
