import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _currentUser;
  bool _isLoading = false;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.login(email, password);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> verify2FA(String email, String code) async {
    _isLoading = true;
    notifyListeners();
    try {
      _currentUser = await _authService.verify2FA(email, code);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _currentUser = null;
    notifyListeners();
  }

  Future<void> loadUserFromPrefs() async {
    _currentUser = await _authService.getUserFromPrefs();
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();
    try {
      _currentUser = await _authService.updateProfile(data);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.changePassword(currentPassword, newPassword);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> uploadAvatar(String imagePath) async {
    _isLoading = true;
    notifyListeners();
    try {
      final avatarStr = await _authService.uploadAvatar(imagePath);
      if (_currentUser != null) {
        // Need to update the user with the new avatar. We construct a new map and use fromJson.
        final json = _currentUser!.toJson();
        json['avatar'] = avatarStr;
        _currentUser = User.fromJson(json);
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
