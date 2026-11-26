<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// v0 — game only: public test route for the arena board (no auth, no data,
// no broadcast). Auth + system come after v0 is perfect.
Route::inertia('arena/gameplay', 'arena/gameplay')->name('arena.gameplay');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
