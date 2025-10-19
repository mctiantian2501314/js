var videoQualities = ${JSON.stringify(videoQualities)};
        var currentQuality = Object.keys(videoQualities)[0] || '1080p';
        var episodeList = ${JSON.stringify(li)};
        var currentEpisodeIndex = ${book.durChapterIndex};

        document.addEventListener('DOMContentLoaded', function() {
            var video = document.getElementById('videoPlayer');
            var playerContainer = document.getElementById('playerContainer');
            var startOverlay = document.getElementById('startOverlay');
            var startButton = document.getElementById('startButton');
            var playBtn = document.getElementById('playBtn');
            var progress = document.getElementById('progress');
            var progressContainer = document.getElementById('progressContainer');
            var buffered = document.getElementById('buffered');
            var currentTime = document.getElementById('currentTime');
            var duration = document.getElementById('duration');
            var fullscreenBtn = document.getElementById('fullscreenBtn');
            var playOverlay = document.getElementById('playOverlay');
            var speedBtn = document.getElementById('speedBtn');
            var qualityBtn = document.getElementById('qualityBtn');
            var volumeBtn = document.getElementById('volumeBtn');
            var volumeIcon = document.getElementById('volumeIcon');
            var volumePopup = document.getElementById('volumePopup');
            var volumePopupSlider = document.getElementById('volumePopupSlider');
            var loading = document.getElementById('loading');
            var speedDisplay = document.getElementById('speedDisplay');
            var volumeDisplay = document.getElementById('volumeDisplay');
            var qualityDisplay = document.getElementById('qualityDisplay');
            var previewThumbnail = document.getElementById('previewThumbnail');
            var previewTime = previewThumbnail.querySelector('.preview-time');
            var landscapeBtn = document.getElementById('landscapeBtn');
            var qualityMenu = document.getElementById('qualityMenu');
            var currentQualityText = document.getElementById('currentQualityText');
            var episodeBtn = document.getElementById('episodeBtn');
            var episodeMenu = document.getElementById('episodeMenu');
            var currentEpisodeText = document.getElementById('currentEpisodeText');
            var fastForwardOverlay = document.getElementById('fastForwardOverlay');
            var fastForwardText = document.getElementById('fastForwardText');
            
            var isDragging = false;
            var speedTimeout, volumeTimeout, qualityTimeout, volumePopupTimeout;
            var isLandscapeMode = false;
            var isFullscreen = false;
            var isAutoLandscape = false;
            
            var touchStartTime = 0;
            var touchStartX = 0;
            var touchStartY = 0;
            var isLongPress = false;
            var longPressInterval;

            function initEpisodeMenu() {
                episodeMenu.innerHTML = '';
                
                if (!episodeList || episodeList.length === 0) {
                    episodeBtn.style.display = 'none';
                    return;
                }
                
                episodeList.forEach(function(episode, index) {
                    var option = document.createElement('div');
                    option.className = 'episode-option' + (index === currentEpisodeIndex ? ' active' : '');
                    option.setAttribute('data-episode-index', index);
                    option.setAttribute('data-item-id', episode.item_id);
                    
                    var episodeText = document.createElement('span');
                    episodeText.textContent = episode.title || ('第' + (index + 1) + '集');
                    
                    option.appendChild(episodeText);
                    episodeMenu.appendChild(option);
                    
                    option.addEventListener('click', function() {
                        selectEpisode(index, episode.item_id, episode.title || ('第' + (index + 1) + '集'));
                    });
                });
            }
            
            function selectEpisode(index, itemId, episodeTitle) {
                if (index === currentEpisodeIndex) return;
                
                currentEpisodeIndex = index;
                initEpisodeMenu();
                
                loading.style.display = 'flex';
                
                setTimeout(function() {
                    var nextChapter = episodeList[index];
                    if (nextChapter) {
                        window.location.href = 'reader://chapter/' + index;
                    }
                    loading.style.display = 'none';
                }, 1000);
            }
            
            function playNextEpisode() {
                var nextIndex = currentEpisodeIndex + 1;
                if (nextIndex < episodeList.length) {
                    selectEpisode(nextIndex, episodeList[nextIndex].item_id, episodeList[nextIndex].title || ('第' + (nextIndex + 1) + '集'));
                }
            }
            
            episodeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                episodeMenu.classList.toggle('show');
                qualityMenu.classList.remove('show');
                hideVolumePopup();
            });
            
            function initQualityMenu() {
                qualityMenu.innerHTML = '';
                var qualities = Object.keys(videoQualities);
                
                if (qualities.length === 0) {
                    qualityBtn.style.display = 'none';
                    return;
                }
                
                qualities.forEach(function(quality) {
                    var option = document.createElement('div');
                    option.className = 'quality-option' + (quality === currentQuality ? ' active' : '');
                    option.setAttribute('data-quality', quality);
                    
                    var qualityText = document.createElement('span');
                    qualityText.textContent = quality;
                    
                    var badge = document.createElement('span');
                    badge.className = 'quality-badge';
                    badge.textContent = videoQualities[quality].width + 'p';
                    
                    option.appendChild(qualityText);
                    option.appendChild(badge);
                    qualityMenu.appendChild(option);
                    
                    option.addEventListener('click', function() {
                        switchQuality(quality);
                    });
                });
                
                updateQualityDisplay();
            }
            
            function updateQualityDisplay() {
                qualityDisplay.textContent = '清晰度: ' + currentQuality;
                currentQualityText.textContent = currentQuality;
            }
            
            function switchQuality(quality) {
                if (!videoQualities[quality] || quality === currentQuality) return;
                
                var currentTime = video.currentTime;
                var wasPlaying = !video.paused;
                
                loading.style.display = 'flex';
                
                video.src = videoQualities[quality].url;
                video.load();
                
                video.onloadeddata = function() {
                    video.currentTime = currentTime;
                    if (wasPlaying) {
                        video.play();
                    }
                    loading.style.display = 'none';
                    
                    currentQuality = quality;
                    initQualityMenu();
                    
                    playerContainer.classList.add('show-quality');
                    clearTimeout(qualityTimeout);
                    qualityTimeout = setTimeout(function() {
                        playerContainer.classList.remove('show-quality');
                    }, 2000);
                    
                    qualityMenu.classList.remove('show');
                };
                
                video.onerror = function() {
                    loading.style.display = 'none';
                    alert('切换清晰度失败，请重试');
                };
            }
            
            qualityBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                qualityMenu.classList.toggle('show');
                episodeMenu.classList.remove('show');
                hideVolumePopup();
            });
            
            function toggleVolumePopup() {
                volumePopup.classList.toggle('show');
                episodeMenu.classList.remove('show');
                qualityMenu.classList.remove('show');
                
                if (volumePopup.classList.contains('show')) {
                    clearTimeout(volumePopupTimeout);
                    volumePopupTimeout = setTimeout(function() {
                        hideVolumePopup();
                    }, 3000);
                }
            }
            
            function hideVolumePopup() {
                volumePopup.classList.remove('show');
            }
            
            volumeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleVolumePopup();
            });
            
            volumePopupSlider.addEventListener('input', function() {
                video.volume = this.value;
                updateVolumeIcon();
                
                volumeDisplay.textContent = '音量: ' + Math.round(video.volume * 100) + '%';
                playerContainer.classList.add('show-volume');
                clearTimeout(volumeTimeout);
                volumeTimeout = setTimeout(function() {
                    playerContainer.classList.remove('show-volume');
                }, 2000);
                
                clearTimeout(volumePopupTimeout);
                volumePopupTimeout = setTimeout(function() {
                    hideVolumePopup();
                }, 3000);
            });
            
            document.addEventListener('click', function() {
                episodeMenu.classList.remove('show');
                qualityMenu.classList.remove('show');
                hideVolumePopup();
            });
            
            episodeMenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            qualityMenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            volumePopup.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            playerContainer.classList.add('show-controls');
            video.volume = 0.5;
            volumePopupSlider.value = 0.5;
            
            initEpisodeMenu();
            initQualityMenu();
            
            video.addEventListener('touchstart', function(e) {
                touchStartTime = Date.now();
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isLongPress = false;
                
                longPressInterval = setTimeout(function() {
                    if (!isLongPress) {
                        isLongPress = true;
                        fastForwardOverlay.classList.add('show');
                    }
                }, 500);
            });
            
            video.addEventListener('touchmove', function(e) {
                if (isLongPress) {
                    e.preventDefault();
                    const deltaX = e.touches[0].clientX - touchStartX;
                    const duration = video.duration;
                    const seekTime = video.currentTime + (deltaX / 100);
                    video.currentTime = Math.min(Math.max(seekTime, 0), duration);
                    
                    const fastForwardSeconds = Math.round(deltaX / 100);
                    fastForwardText.textContent = '快进 ' + (fastForwardSeconds > 0 ? '+' : '') + fastForwardSeconds + '秒';
                }
            });
            
            video.addEventListener('touchend', function(e) {
                clearTimeout(longPressInterval);
                
                if (isLongPress) {
                    isLongPress = false;
                    fastForwardOverlay.classList.remove('show');
                }
            });
            
            video.addEventListener('ended', function() {
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                playOverlay.innerHTML = '<div class="big-play-btn"><i class="fas fa-play"></i></div>';
                playOverlay.style.opacity = 1;
                
                setTimeout(function() {
                    playNextEpisode();
                }, 2000);
                
                if (isFullscreen) {
                    toggleFullscreen();
                } else {
                    startOverlay.style.display = 'flex';
                }
            });
            
            function checkFullscreen() {
                isFullscreen = document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement || 
                              document.msFullscreenElement;
                updateLandscapeBtnVisibility();
            }
            
            function updateLandscapeBtnVisibility() {
                if (isFullscreen) {
                    landscapeBtn.classList.add('hidden');
                } else if (video.videoWidth > video.videoHeight) {
                    landscapeBtn.classList.remove('hidden');
                    landscapeBtn.classList.add('show');
                } else {
                    landscapeBtn.classList.add('hidden');
                    landscapeBtn.classList.remove('show');
                }
            }
            
            function checkVideoOrientation() {
                if (video.videoWidth > video.videoHeight) {
                    playerContainer.classList.add('landscape');
                    if (!isFullscreen) {
                        landscapeBtn.classList.remove('hidden');
                        landscapeBtn.classList.add('show');
                    }
                } else {
                    playerContainer.classList.remove('landscape');
                    landscapeBtn.classList.add('hidden');
                    landscapeBtn.classList.remove('show');
                }
            }
            
            function startPlayback() {
                startOverlay.style.display = 'none';
                video.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                playerContainer.classList.add('show-controls');
                checkLandscapeMode();
            }
            
            startButton.addEventListener('click', startPlayback);
            
            function togglePlay() {
                if (video.paused) {
                    video.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    playOverlay.innerHTML = '<div class="big-play-btn"><i class="fas fa-pause"></i></div>';
                } else {
                    video.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    playOverlay.innerHTML = '<div class="big-play-btn"><i class="fas fa-play"></i></div>';
                }
                
                playOverlay.style.opacity = 1;
                setTimeout(function() {
                    playOverlay.style.opacity = 0;
                }, 500);
            }
            
            playBtn.addEventListener('click', togglePlay);
            
            function updateProgress() {
                if (isDragging) return;
                
                var percent = (video.currentTime / video.duration) * 100;
                progress.style.width = percent + '%';
                
                var currentMins = Math.floor(video.currentTime / 60);
                var currentSecs = Math.floor(video.currentTime % 60);
                var durationMins = Math.floor(video.duration / 60);
                var durationSecs = Math.floor(video.duration % 60);
                
                currentTime.textContent = 
                    (currentMins < 10 ? '0' : '') + currentMins + ':' + (currentSecs < 10 ? '0' : '') + currentSecs;
                
                duration.textContent = 
                    (durationMins < 10 ? '0' : '') + durationMins + ':' + (durationSecs < 10 ? '0' : '') + durationSecs;
                
                if (video.buffered.length > 0) {
                    var bufferedEnd = video.buffered.end(video.buffered.length - 1);
                    var bufferedPercent = (bufferedEnd / video.duration) * 100;
                    buffered.style.width = bufferedPercent + '%';
                }
            }
            
            video.addEventListener('timeupdate', updateProgress);
            
            function startDrag(e) {
                e.preventDefault();
                isDragging = true;
                progressContainer.classList.add('dragging');
                previewThumbnail.style.opacity = 0;
                
                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', endDrag);
                document.addEventListener('touchmove', drag);
                document.addEventListener('touchend', endDrag);
                
                updateDrag(e);
            }
            
            function drag(e) {
                if (!isDragging) return;
                updateDrag(e);
            }
            
            function updateDrag(e) {
                var rect = progressContainer.getBoundingClientRect();
                var position;
                
                if (e.type.indexOf('touch') !== -1) {
                    position = (e.touches[0].clientX - rect.left) / rect.width;
                } else {
                    position = (e.clientX - rect.left) / rect.width;
                }
                
                position = Math.max(0, Math.min(1, position));
                var newTime = position * video.duration;
                
                progress.style.width = (position * 100) + '%';
                
                var previewMins = Math.floor(newTime / 60);
                var previewSecs = Math.floor(newTime % 60);
                previewTime.textContent = 
                    (previewMins < 10 ? '0' : '') + previewMins + ':' + (previewSecs < 10 ? '0' : '') + previewSecs;
                
                currentTime.textContent = previewTime.textContent;
            }
            
            function endDrag(e) {
                if (!isDragging) return;
                
                var rect = progressContainer.getBoundingClientRect();
                var position;
                
                if (e.type.indexOf('touch') !== -1) {
                    position = (e.changedTouches[0].clientX - rect.left) / rect.width;
                } else {
                    position = (e.clientX - rect.left) / rect.width;
                }
                
                position = Math.max(0, Math.min(1, position));
                video.currentTime = position * video.duration;
                
                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', endDrag);
                document.removeEventListener('touchmove', drag);
                document.removeEventListener('touchend', endDrag);
                
                progressContainer.classList.remove('dragging');
                isDragging = false;
            }
            
            progressContainer.addEventListener('mousedown', startDrag);
            progressContainer.addEventListener('touchstart', startDrag);
            
            video.addEventListener('waiting', function() {
                loading.style.display = 'flex';
            });
            
            video.addEventListener('playing', function() {
                loading.style.display = 'none';
            });
            
            function toggleFullscreen() {
                if (!document.fullscreenElement) {
                    if (playerContainer.requestFullscreen) {
                        playerContainer.requestFullscreen();
                    } else if (playerContainer.webkitRequestFullscreen) {
                        playerContainer.webkitRequestFullscreen();
                    } else if (playerContainer.msRequestFullscreen) {
                        playerContainer.msRequestFullscreen();
                    }
                    isFullscreen = true;
                    playerContainer.classList.add('fullscreen-landscape');
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                    isFullscreen = false;
                    playerContainer.classList.remove('fullscreen-landscape');
                }
                updateLandscapeBtnVisibility();
            }
            
            fullscreenBtn.addEventListener('click', toggleFullscreen);
            landscapeBtn.addEventListener('click', toggleFullscreen);
            
            function handleFullscreenChange() {
                if (document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement) {
                    isFullscreen = true;
                    playerContainer.classList.add('fullscreen-landscape');
                } else {
                    isFullscreen = false;
                    playerContainer.classList.remove('fullscreen-landscape');
                    if (isLandscapeMode) {
                        enterLandscapeMode();
                    }
                }
                updateLandscapeBtnVisibility();
            }
            
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.addEventListener('mozfullscreenchange', handleFullscreenChange);
            document.addEventListener('MSFullscreenChange', handleFullscreenChange);
            
            var controlsTimeout;
            
            function showControls() {
                playerContainer.classList.add('show-controls');
                clearTimeout(controlsTimeout);
                controlsTimeout = setTimeout(function() {
                    playerContainer.classList.remove('show-controls');
                }, 3000);
            }
            
            playerContainer.addEventListener('mousemove', showControls);
            playerContainer.addEventListener('touchstart', showControls);
            
            function updateVolumeIcon() {
                if (video.volume === 0) {
                    volumeIcon.className = 'fas fa-volume-mute';
                } else if (video.volume < 0.5) {
                    volumeIcon.className = 'fas fa-volume-down';
                } else {
                    volumeIcon.className = 'fas fa-volume-up';
                }
            }
            
            speedBtn.addEventListener('click', function() {
                var speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
                var currentSpeed = video.playbackRate;
                var currentIndex = speeds.indexOf(currentSpeed);
                var nextIndex = (currentIndex + 1) % speeds.length;
                
                video.playbackRate = speeds[nextIndex];
                
                if (speeds[nextIndex] === 1) {
                    speedDisplay.textContent = '正常速度';
                } else {
                    speedDisplay.textContent = speeds[nextIndex] + 'x 倍速';
                }
                
                playerContainer.classList.add('show-speed');
                clearTimeout(speedTimeout);
                speedTimeout = setTimeout(function() {
                    playerContainer.classList.remove('show-speed');
                }, 2000);
            });
            
            video.addEventListener('loadedmetadata', function() {
                var mins = Math.floor(video.duration / 60);
                var secs = Math.floor(video.duration % 60);
                duration.textContent = 
                    (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
                
                checkVideoOrientation();
                checkFullscreen();
            });
            
            video.addEventListener('resize', checkVideoOrientation);
            
            updateVolumeIcon();
            
            landscapeBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateX(-50%) scale(1.05)';
            });
            
            landscapeBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateX(-50%)';
            });
            
            function checkLandscapeMode() {
                if (window.innerWidth > window.innerHeight) {
                    enterLandscapeMode();
                } else {
                    exitLandscapeMode();
                }
            }
            
            function enterLandscapeMode() {
                isLandscapeMode = true;
                if (!isFullscreen) {
                    toggleFullscreen();
                }
                playerContainer.classList.add('fullscreen-landscape');
            }
            
            function exitLandscapeMode() {
                isLandscapeMode = false;
                if (isFullscreen) {
                    toggleFullscreen();
                }
                playerContainer.classList.remove('fullscreen-landscape');
            }
            
            window.addEventListener('resize', function() {
                checkLandscapeMode();
            });
            
            checkLandscapeMode();
        });