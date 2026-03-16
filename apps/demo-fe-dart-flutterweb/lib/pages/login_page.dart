import 'dart:js_interop';

import 'package:dio/dio.dart';
import 'package:web/web.dart';

import '../models/auth.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart' as auth_svc;
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
  h1.textContent = 'Log In';
  h1.style.setProperty('margin-bottom', '1.5rem');
  main.appendChild(h1);

  // Show registration success message
  final searchParams = Uri.parse(window.location.href).queryParameters;
  if (searchParams['registered'] == 'true') {
    final successDiv = document.createElement('div') as HTMLDivElement;
    successDiv.setAttribute('role', 'status');
    successDiv.textContent = 'Registration successful. Please log in.';
    successDiv.style.setProperty('background-color', '#eaf7ea');
    successDiv.style.setProperty('color', '#2d7a2d');
    successDiv.style.setProperty('padding', '0.75rem 1rem');
    successDiv.style.setProperty('border-radius', '4px');
    successDiv.style.setProperty('margin-bottom', '1rem');
    successDiv.style.setProperty('border', '1px solid #c3e6c3');
    main.appendChild(successDiv);
  }

  // Error container
  final errorDiv = document.createElement('div') as HTMLDivElement;
  errorDiv.id = 'login-error';
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
  passwordInput.autocomplete = 'current-password';
  passwordInput.setAttribute('aria-required', 'true');
  passwordInput.style.setProperty('width', '100%');
  passwordInput.style.setProperty('padding', '0.6rem 0.75rem');
  passwordInput.style.setProperty('border', '1px solid #ccc');
  passwordInput.style.setProperty('border-radius', '4px');
  passwordInput.style.setProperty('font-size', '1rem');
  passwordInput.style.setProperty('box-sizing', 'border-box');
  passwordGroup.appendChild(passwordInput);

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
  submitBtn.textContent = 'Log In';
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
      // Clear errors
      errorDiv.style.setProperty('display', 'none');
      usernameError.style.setProperty('display', 'none');
      passwordError.style.setProperty('display', 'none');
      usernameInput.setAttribute('aria-invalid', 'false');
      passwordInput.setAttribute('aria-invalid', 'false');

      final username = usernameInput.value.trim();
      final password = passwordInput.value;

      // Validate
      var valid = true;
      if (username.isEmpty) {
        usernameError.textContent = 'Username is required';
        usernameError.style.setProperty('display', 'block');
        usernameInput.setAttribute('aria-invalid', 'true');
        usernameInput.setAttribute('aria-describedby', 'username-error');
        valid = false;
      }
      if (password.isEmpty) {
        passwordError.textContent = 'Password is required';
        passwordError.style.setProperty('display', 'block');
        passwordInput.setAttribute('aria-invalid', 'true');
        passwordInput.setAttribute('aria-describedby', 'password-error');
        valid = false;
      }
      if (!valid) return;

      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
      submitBtn.style.setProperty('cursor', 'not-allowed');

      () async {
        try {
          final tokens = await auth_svc.login(
            LoginRequest(username: username, password: password),
          );
          setTokens(tokens.accessToken, tokens.refreshToken);
          router.navigateTo('/expenses');
        } on DioException catch (err) {
          submitBtn.textContent = 'Log In';
          submitBtn.disabled = false;
          submitBtn.style.setProperty('cursor', 'pointer');

          final status = err.response?.statusCode;
          final body = err.response?.data;
          final msg = body is Map ? (body['message'] as String? ?? '') : '';

          String errorMsg;
          if (status == 401) {
            if (msg.toLowerCase().contains('locked')) {
              errorMsg =
                  'Your account is locked. Please contact an administrator.';
            } else {
              errorMsg = 'Invalid username or password.';
            }
          } else if (status == 403) {
            errorMsg = 'Your account is deactivated or disabled.';
          } else {
            errorMsg = 'Login failed. Please try again.';
          }

          errorDiv.textContent = errorMsg;
          errorDiv.style.setProperty('display', 'block');
        }
      }();
    }).toJS,
  );

  main.appendChild(form);

  final registerLink = document.createElement('p') as HTMLParagraphElement;
  registerLink.style.setProperty('margin-top', '1rem');
  registerLink.style.setProperty('text-align', 'center');
  registerLink.style.setProperty('color', '#666');
  registerLink.append(
    document.createTextNode("Don't have an account? ") as Node,
  );

  final regA = document.createElement('a') as HTMLAnchorElement;
  regA.href = '/register';
  regA.style.setProperty('color', '#1a73e8');
  regA.textContent = 'Register';
  regA.addEventListener(
    'click',
    ((Event e) {
      e.preventDefault();
      router.navigateTo('/register');
    }).toJS,
  );
  registerLink.appendChild(regA);
  main.appendChild(registerLink);

  parent.appendChild(main);
}
