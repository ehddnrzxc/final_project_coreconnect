package com.goodee.coreconnect.dashboard.repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.goodee.coreconnect.dashboard.entity.Dashboard;
import com.goodee.coreconnect.user.entity.User;

public interface DashboardRepository extends JpaRepository<Dashboard, Integer> {

    Optional<Dashboard> findByUserAndDashDate(User user, LocalDate date);

    List<Dashboard> findByUserOrderByDashDateDesc(User user);

    List<Dashboard> findByDashDate(LocalDate date);
}
