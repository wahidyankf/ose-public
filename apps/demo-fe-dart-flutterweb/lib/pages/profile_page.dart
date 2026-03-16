import 'dart:js_interop';

import 'package:dio/dio.dart';
import 'package:web/web.dart';

import '../services/api_client.dart';
import '../services/user_service.dart' as user_svc;
import '../models/user.dart';
import '../main.dart' as router;

void render(Element parent) {
  final main = document.createElement('main') as HTMLElement
    ..style.setProperty('max-width', '40rem')
    ..style.setProperty('margin', '2rem auto')
    ..style.setProperty('padding', '0 1rem');

  final h1 = document.createElement('h1') as HTMLHeadingElement
    ..textContent = 'Profile'
    ..style.setProperty('margin-bottom', '1.5rem')
    ..style.setProperty('margin-top', '0');
  main.appendChild(h1);

  final loading = document.createElement('p') as HTMLParagraphElement
    ..textContent = 'Loading profile...'
    ..style.setProperty('color', '#666');
  main.appendChild(loading);
  parent.appendChild(main);

  user_svc.getCurrentUser().then((user) {
    loading.remove();
    _renderProfile(main, user);
  }).catchError((_) {
    loading.remove();
    final errEl = document.createElement('p') as HTMLParagraphElement
      ..setAttribute('role', 'alert')
      ..textContent = 'Failed to load profile. Please try again.'
      ..style.setProperty('color', '#c0392b');
    main.appendChild(errEl);
  });
}

void _renderProfile(Element main, User user) {
  // Account information card
  final infoCard = _makeCard();
  final infoH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Account Information'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  infoCard.appendChild(infoH2);

  final dl = document.createElement('dl') as HTMLElement
    ..style.setProperty('margin', '0');

  void addInfo(String term, String value) {
    final dt = document.createElement('dt') as HTMLElement
      ..textContent = term
      ..style.setProperty('font-weight', '600')
      ..style.setProperty('color', '#555')
      ..style.setProperty('font-size', '0.85rem')
      ..style.setProperty('margin-top', '0.75rem')
      ..style.setProperty('margin-bottom', '0.2rem');
    final dd = document.createElement('dd') as HTMLElement
      ..textContent = value
      ..style.setProperty('margin', '0')
      ..style.setProperty('font-size', '1rem');
    dl
      ..appendChild(dt)
      ..appendChild(dd);
  }

  addInfo('Username', user.username);
  addInfo('Email', user.email);
  addInfo('Display Name', user.displayName);
  addInfo('Status', user.status);

  infoCard.appendChild(dl);
  main.appendChild(infoCard);

  // Edit display name card
  final editNameCard = _makeCard();
  final editNameH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Edit Display Name'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  editNameCard.appendChild(editNameH2);

  final nameSuccess = document.createElement('div') as HTMLDivElement
    ..setAttribute('role', 'status')
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#eaf7ea')
    ..style.setProperty('color', '#2d7a2d')
    ..style.setProperty('padding', '0.75rem 1rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('border', '1px solid #c3e6c3');
  editNameCard.appendChild(nameSuccess);

  final nameError = document.createElement('div') as HTMLDivElement
    ..id = 'profile-error'
    ..setAttribute('role', 'alert')
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#fdf2f2')
    ..style.setProperty('color', '#c0392b')
    ..style.setProperty('padding', '0.75rem 1rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('border', '1px solid #f5c6cb');
  editNameCard.appendChild(nameError);

  final nameForm = document.createElement('form') as HTMLFormElement
    ..setAttribute('novalidate', '');

  final nameGroup = document.createElement('div') as HTMLDivElement
    ..style.setProperty('margin-bottom', '1rem');
  final nameLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'displayName'
    ..textContent = 'Display Name'
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.4rem');
  nameGroup.appendChild(nameLabel);
  final displayNameInput = document.createElement('input') as HTMLInputElement
    ..id = 'displayName'
    ..type = 'text'
    ..value = user.displayName
    ..setAttribute('aria-required', 'true')
    ..style.setProperty('width', '100%')
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('box-sizing', 'border-box');
  nameGroup.appendChild(displayNameInput);
  nameForm.appendChild(nameGroup);

  final nameSaveBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'submit'
    ..textContent = 'Save Changes'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#1a73e8')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');
  nameForm.appendChild(nameSaveBtn);

  nameForm.addEventListener(
    'submit',
    ((Event e) {
      e.preventDefault();
      nameSuccess.style.setProperty('display', 'none');
      nameError.style.setProperty('display', 'none');

      final newName = displayNameInput.value.trim();
      if (newName.isEmpty) {
        nameError
          ..textContent = 'Display name is required.'
          ..style.setProperty('display', 'block');
        return;
      }

      nameSaveBtn
        ..textContent = 'Saving...'
        ..disabled = true;

      () async {
        try {
          await user_svc.updateProfile(UpdateProfileRequest(displayName: newName));
          nameSaveBtn
            ..textContent = 'Save Changes'
            ..disabled = false;
          nameSuccess
            ..textContent = 'Display name updated successfully.'
            ..style.setProperty('display', 'block');
        } on DioException {
          nameSaveBtn
            ..textContent = 'Save Changes'
            ..disabled = false;
          nameError
            ..textContent = 'Failed to update display name. Please try again.'
            ..style.setProperty('display', 'block');
        }
      }();
    }).toJS,
  );

  editNameCard.appendChild(nameForm);
  main.appendChild(editNameCard);

  // Change password card
  final pwCard = _makeCard();
  final pwH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Change Password'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  pwCard.appendChild(pwH2);

  final pwSuccess = document.createElement('div') as HTMLDivElement
    ..setAttribute('role', 'status')
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#eaf7ea')
    ..style.setProperty('color', '#2d7a2d')
    ..style.setProperty('padding', '0.75rem 1rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('border', '1px solid #c3e6c3');
  pwCard.appendChild(pwSuccess);

  final pwError = document.createElement('div') as HTMLDivElement
    ..id = 'pw-error'
    ..setAttribute('role', 'alert')
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#fdf2f2')
    ..style.setProperty('color', '#c0392b')
    ..style.setProperty('padding', '0.75rem 1rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('border', '1px solid #f5c6cb');
  pwCard.appendChild(pwError);

  final pwForm = document.createElement('form') as HTMLFormElement
    ..setAttribute('novalidate', '');

  final oldPwGroup = document.createElement('div') as HTMLDivElement
    ..style.setProperty('margin-bottom', '1rem');
  final oldPwLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'oldPassword'
    ..textContent = 'Current Password'
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.4rem');
  oldPwGroup.appendChild(oldPwLabel);
  final oldPwInput = document.createElement('input') as HTMLInputElement
    ..id = 'oldPassword'
    ..type = 'password'
    ..setAttribute('aria-required', 'true')
    ..autocomplete = 'current-password'
    ..style.setProperty('width', '100%')
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('box-sizing', 'border-box');
  oldPwGroup.appendChild(oldPwInput);
  pwForm.appendChild(oldPwGroup);

  final newPwGroup = document.createElement('div') as HTMLDivElement
    ..style.setProperty('margin-bottom', '1rem');
  final newPwLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'newPassword'
    ..textContent = 'New Password'
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.4rem');
  newPwGroup.appendChild(newPwLabel);
  final newPwInput = document.createElement('input') as HTMLInputElement
    ..id = 'newPassword'
    ..type = 'password'
    ..setAttribute('aria-required', 'true')
    ..autocomplete = 'new-password'
    ..style.setProperty('width', '100%')
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('box-sizing', 'border-box');
  newPwGroup.appendChild(newPwInput);
  pwForm.appendChild(newPwGroup);

  final pwBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'submit'
    ..textContent = 'Change Password'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#1a73e8')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');
  pwForm.appendChild(pwBtn);

  pwForm.addEventListener(
    'submit',
    ((Event e) {
      e.preventDefault();
      pwSuccess.style.setProperty('display', 'none');
      pwError.style.setProperty('display', 'none');

      final oldPw = oldPwInput.value;
      final newPw = newPwInput.value;

      if (oldPw.isEmpty || newPw.isEmpty) {
        pwError
          ..textContent = 'Both fields are required.'
          ..style.setProperty('display', 'block');
        return;
      }

      pwBtn
        ..textContent = 'Changing...'
        ..disabled = true;

      () async {
        try {
          await user_svc.changePassword(
            ChangePasswordRequest(oldPassword: oldPw, newPassword: newPw),
          );
          pwBtn
            ..textContent = 'Change Password'
            ..disabled = false;
          oldPwInput.value = '';
          newPwInput.value = '';
          pwSuccess
            ..textContent = 'Password changed successfully.'
            ..style.setProperty('display', 'block');
        } on DioException catch (err) {
          pwBtn
            ..textContent = 'Change Password'
            ..disabled = false;
          final status = err.response?.statusCode;
          if (status == 400) {
            pwError
              ..textContent = 'Current password is incorrect.'
              ..style.setProperty('display', 'block');
          } else {
            pwError
              ..textContent = 'Failed to change password. Please try again.'
              ..style.setProperty('display', 'block');
          }
        }
      }();
    }).toJS,
  );

  pwCard.appendChild(pwForm);
  main.appendChild(pwCard);

  // Danger zone card
  final dangerCard = _makeCard();
  final dangerTitle = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Danger Zone'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('color', '#c0392b');
  dangerCard.appendChild(dangerTitle);

  // Deactivate confirmation dialog (inline in the card)
  final confirmSection = document.createElement('div') as HTMLDivElement
    ..id = 'deactivate-confirm'
    ..setAttribute('role', 'alertdialog')
    ..setAttribute('aria-modal', 'true')
    ..setAttribute('aria-labelledby', 'deactivate-dialog-title')
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#fdf2f2')
    ..style.setProperty('border', '1px solid #f5c6cb')
    ..style.setProperty('border-radius', '6px')
    ..style.setProperty('padding', '1rem')
    ..style.setProperty('margin-top', '1rem');

  final confirmDialogTitle = document.createElement('h3') as HTMLHeadingElement
    ..id = 'deactivate-dialog-title'
    ..textContent = 'Are you sure you want to deactivate your account?'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '0.5rem')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('color', '#c0392b');
  confirmSection.appendChild(confirmDialogTitle);

  final confirmMsg = document.createElement('p') as HTMLParagraphElement
    ..textContent =
        'This action cannot be undone. You will be logged out immediately.'
    ..style.setProperty('color', '#666')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('font-size', '0.9rem');
  confirmSection.appendChild(confirmMsg);

  final confirmRow = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.75rem');

  final confirmDeactivateBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Yes, Deactivate'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#c0392b')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');

  final cancelDeactivateBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Cancel'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#f5f5f5')
    ..style.setProperty('color', '#333')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');

  cancelDeactivateBtn.addEventListener(
    'click',
    ((Event _) {
      confirmSection.style.setProperty('display', 'none');
    }).toJS,
  );

  confirmDeactivateBtn.addEventListener(
    'click',
    ((Event _) {
      () async {
        confirmDeactivateBtn
          ..textContent = 'Deactivating...'
          ..disabled = true;
        try {
          await user_svc.deactivateAccount();
        } catch (_) {
          // proceed to logout regardless
        }
        clearTokens();
        router.navigateTo('/login');
      }();
    }).toJS,
  );

  confirmRow
    ..appendChild(confirmDeactivateBtn)
    ..appendChild(cancelDeactivateBtn);
  confirmSection.appendChild(confirmRow);

  final deactivateBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Deactivate Account'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#c0392b')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');

  deactivateBtn.addEventListener(
    'click',
    ((Event _) {
      confirmSection.style.setProperty('display', 'block');
      confirmDeactivateBtn.focus();
    }).toJS,
  );

  dangerCard.appendChild(deactivateBtn);
  dangerCard.appendChild(confirmSection);
  main.appendChild(dangerCard);
}

HTMLDivElement _makeCard() {
  return document.createElement('div') as HTMLDivElement
    ..style.setProperty('background-color', '#ffffff')
    ..style.setProperty('padding', '1.5rem')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('border', '1px solid #ddd')
    ..style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.06)')
    ..style.setProperty('margin-bottom', '1.5rem');
}
